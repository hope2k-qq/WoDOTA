require("libs/talents_list")

if WodaTalents == nil then 
	_G.WodaTalents = class({})
    WodaTalents.playerstalents = {}
    WodaTalents.line_level_info =
    {
        [1] = 0,
        [2] = 4,
        [3] = 8,
        [4] = 12,
        [5] = 16,
        [6] = 20,
        [7] = 24,
    }
end

function WodaTalents:InitTalents()
    CustomGameEventManager:RegisterListener("talent_learn", Dynamic_Wrap(self, "talent_learn"))
	for heroname, talents in pairs(_G.herotalents) do
		CustomNetTables:SetTableValue("herotalents", heroname, talents)
	end
	for i = 0, 10 do 
		if WodaTalents.playerstalents[i] == nil then 
			WodaTalents.playerstalents[i] = 
            {
                ["maxpoints"] = 0,
                ["points"] = 0,
            }
		end
		self:AddPointTalent(i, 1)
	end
end

function WodaTalents:AddPointTalent(id,count)
    if not WodaTalents.playerstalents[id] then return end
    WodaTalents.playerstalents[id]["talantpoints"] = (WodaTalents.playerstalents[id]["talantpoints"] or 0) + count
	CustomNetTables:SetTableValue("playerstalents", tostring(id), WodaTalents.playerstalents[id])
end

function WodaTalents:OnHeroLevelUp(keys)
    WodaTalents:AddPointTalent(keys.PlayerID, 1)
end

function WodaTalents:AddPoint(id, count, no_effect)
    if not WodaTalents.playerstalents[id] then return end
    local hero = PlayerResource:GetSelectedHeroEntity(id)
    if hero == nil then return end
    if WodaTalents.playerstalents[id]["maxpoints"] >= 10 then 
        WodaTalents.playerstalents[id]["points"] = 0
        WodaTalents.playerstalents[id]["hasmax"] = true
        CustomNetTables:SetTableValue("playerstalents", tostring(id), WodaTalents.playerstalents[id])
        return
    end
    WodaTalents.playerstalents[id]["points"] = (WodaTalents.playerstalents[id]["points"] or 0) + count
    if WodaTalents.playerstalents[id]["points"] >= 10 then 
        WodaTalents.playerstalents[id]["points"] = WodaTalents.playerstalents[id]["points"] - 10
        self:AddPointTalent(id, 1)
        if hero and not no_effect then
            local fx = ParticleManager:CreateParticle("particles/hero_levelup_fall_2021_godray2.vpcf", PATTACH_ABSORIGIN_FOLLOW, hero)
            ParticleManager:ReleaseParticleIndex(fx)
        end
        WodaTalents.playerstalents[id]["maxpoints"] = WodaTalents.playerstalents[id]["maxpoints"] + 1
        if WodaTalents.playerstalents[id]["maxpoints"] >= 10 then 
            WodaTalents.playerstalents[id]["points"] = 0
            WodaTalents.playerstalents[id]["hasmax"] = true
        end
        if not no_effect then
            CustomGameEventManager:Send_ServerToPlayer(PlayerResource:GetPlayer(id), "woda_client_sound", {sound="ui.treasure_02", })
        end
    end
	CustomNetTables:SetTableValue("playerstalents", tostring(id), WodaTalents.playerstalents[id])
end

function WodaTalents:talent_learn(params)
	if params.PlayerID == nil then return end
    local player_id = params.PlayerID
	local hero = PlayerResource:GetSelectedHeroEntity(player_id)
	if hero == nil then return end
    local talent_name = params.talentname
    local hero_name = hero:GetUnitName()
    -- Проверка на плохую связь талантов
    if LockedTalents[hero_name] then
        if LockedTalents[hero_name][talent_name] then
            local is_avialable = true
            for _, talent_checkout in pairs(LockedTalents[hero_name][talent_name]) do
                if WodaTalents.playerstalents[player_id][talent_checkout] then
                    is_avialable = false
                    break
                end
            end
            if not is_avialable then return end
        end
    end
    -- Имеет ли этот талант герой
	if WodaTalents:FindTalent(talent_name, hero_name) then 
        return 
    end
    -- Проверка сколько нужно талантов в ветке, чтобы прокачаться дальше
    local talent_branch = WodaTalents:GetTalentBranch(talent_name, hero_name)
    if (WodaTalents.playerstalents[player_id][params.attribute] or 0) < WodaTalents.line_level_info[talent_branch] then
        return
    end
    -- Перезарядка на прочивание таланта
    if hero.cooldown_talents then return end
    hero.cooldown_talents = false
    Timers:CreateTimer(0.2, function()
        hero.cooldown_talents = nil
    end)
    -- Создание таблицы таланта
    if WodaTalents.playerstalents[player_id][talent_name] == nil then
        WodaTalents.playerstalents[player_id][talent_name] = {}
    end
    -- Есть ли уже уровень таланта, если он максимальный, то не идем дальше
    if WodaTalents.playerstalents[player_id][talent_name]["level"] then
        if tonumber(WodaTalents.playerstalents[player_id][talent_name]["level"]) >= WodaTalents:FindTalentMaxLevel(talent_name, hero_name) then
            return
        end
    end
    -- Какое количество поинтов у игрока
    if WodaTalents.playerstalents[player_id]["talantpoints"] ~= nil then
        if tonumber(WodaTalents.playerstalents[player_id]["talantpoints"]) <= 0 then
            return
        end
    end
    -- Прокачивание таланта
    WodaTalents.playerstalents[player_id][talent_name]["level"] = (WodaTalents.playerstalents[player_id][talent_name]["level"] or 0) + 1
    WodaTalents.playerstalents[player_id][params.attribute] = (WodaTalents.playerstalents[player_id][params.attribute] or 0) + 1
    WodaTalents.playerstalents[player_id]["talantpoints"] = (WodaTalents.playerstalents[player_id]["talantpoints"] or 0) - 1
    -- Сохранение визуала
    CustomNetTables:SetTableValue("playerstalents", tostring(player_id), WodaTalents.playerstalents[player_id])
    -- Добавление модификатора
    Timers:CreateTimer(0,function()	
        if hero and not hero:IsAlive() then return 0.1 end
        local modifier_talent = hero:AddNewModifier(hero, nil, talent_name, {})
    end)
    -- Квесты на талант
    if params.attribute == "str" then
        player_system:PlayerQuestProgress(player_id, 15, 1)
        player_system:PlayerQuestProgress(player_id, 16, 1)
    elseif params.attribute == "agi" then
        player_system:PlayerQuestProgress(player_id, 37, 1)
        player_system:PlayerQuestProgress(player_id, 38, 1)
    elseif params.attribute == "int" then
        player_system:PlayerQuestProgress(player_id, 59, 1)
        player_system:PlayerQuestProgress(player_id, 60, 1)
    end
end

function WodaTalents:FindTalentMaxLevel(ftalent, fhero)
	for attribute,attribute_skilltable in pairs(_G.herotalents[tostring(fhero)]) do 
		for line,line_skilltable in pairs(attribute_skilltable) do 
			for talent_number,talent_info in pairs(line_skilltable) do
				if not string.find(talent_info[1], "empty") then
					if talent_info[1] == tostring(ftalent) then
						return talent_info[3]
					end
				end
			end
		end
	end
	return 0
end

function WodaTalents:FindTalent(ftalent, fhero)
	for attribute,attribute_skilltable in pairs(_G.herotalents[tostring(fhero)]) do 
		for line,line_skilltable in pairs(attribute_skilltable) do 
			for talent_number,talent_info in pairs(line_skilltable) do
				if not string.find(talent_info[1], "empty") then
					if talent_info[1] == tostring(ftalent) then
						return false
					end
				end
			end
		end
	end
	return true
end

function WodaTalents:GetTalentBranch(ftalent, fhero)
	for attribute,attribute_skilltable in pairs(_G.herotalents[tostring(fhero)]) do 
		for line,line_skilltable in pairs(attribute_skilltable) do 
			for talent_number,talent_info in pairs(line_skilltable) do
				if not string.find(talent_info[1], "empty") then
					if talent_info[1] == tostring(ftalent) then
						return line
					end
				end
			end
		end
	end
	return nil
end