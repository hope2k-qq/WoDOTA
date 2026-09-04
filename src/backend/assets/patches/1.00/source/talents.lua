if wodatalents == nil then 
	_G.wodatalents = class({})
    _G.playerstalents = {}
end

-- basictalents: данные перенесены в talents_list.lua

-- herotalents: данные перенесены в talents_list.lua

for hero,skilltable in pairs(herotalents) do 
	for attribute,attribute_skilltable in pairs(skilltable) do 
		for line,line_skilltable in pairs(attribute_skilltable) do 
			for talent_number,talent_info in pairs(line_skilltable) do
				if not string.find(talent_info[1], "empty") then 
					local hero_talent = true
					for basicid,basic_talent in pairs(basictalents) do
						if talent_info[1] == basic_talent then 
							hero_talent = false
						end
					end
					if hero_talent then
						LinkLuaModifier(talent_info[1], "modifiers/talents/"..hero.."/"..talent_info[1]..".lua", LUA_MODIFIER_MOTION_NONE)
					end
				end
			end
		end
	end
end

for basicid,basic_talent in pairs(basictalents) do
	LinkLuaModifier(basic_talent, "modifiers/talents/basic/"..basic_talent..".lua", LUA_MODIFIER_MOTION_NONE)
end

function wodatalents:inittalents()
	for heroname, talents in pairs(herotalents) do
		CustomNetTables:SetTableValue("herotalents", heroname, talents)
	end
	CustomGameEventManager:RegisterListener("talent_learn", Dynamic_Wrap(self, "talent_learn"))
	for i = 0, 10 do 
		if playerstalents[i] == nil then 
			playerstalents[i] = {}
		end
		self:AddPointTalent(i,1)
	end
end

function wodatalents:AddPointTalent(id,count)
	if playerstalents[id] ~= nil then
		if playerstalents[id]["talantpoints"] == nil then
			playerstalents[id]["talantpoints"] = count
		else
			playerstalents[id]["talantpoints"] = playerstalents[id]["talantpoints"] + count
		end
		CustomNetTables:SetTableValue("playerstalents", tostring(id), playerstalents[id])
	end
end

function wodatalents:AddPoint(id,count)
	if playerstalents[id] ~= nil then
		if playerstalents[id]["maxpoints"] == nil then 
			playerstalents[id]["maxpoints"] = 0
		end
		if playerstalents[id]["maxpoints"] >= 10 then 
			playerstalents[id]["points"] = 0
			playerstalents[id]["hasmax"] = true
			CustomNetTables:SetTableValue("playerstalents", tostring(id), playerstalents[id])
			return
		end
		if playerstalents[id]["points"] == nil then
			playerstalents[id]["points"] = count
		else
			playerstalents[id]["points"] = playerstalents[id]["points"] + count
		end
		if playerstalents[id]["points"] >= 10 then 
			playerstalents[id]["points"] = playerstalents[id]["points"] - 10
			self:AddPointTalent(id,1)
			CustomGameEventManager:Send_ServerToPlayer(PlayerResource:GetPlayer(id), "woda_client_sound", {sound="ui.treasure_02", })
			local hero = PlayerResource:GetSelectedHeroEntity(id)
			if hero then 
				ParticleManager:CreateParticle("particles/hero_levelup_fall_2021_godray2.vpcf", PATTACH_ABSORIGIN_FOLLOW, hero)
			end
			if playerstalents[id]["maxpoints"] ~= nil then 
				playerstalents[id]["maxpoints"] = playerstalents[id]["maxpoints"] + 1 
			end
			if playerstalents[id]["maxpoints"] >= 10 then 
				playerstalents[id]["points"] = 0
				playerstalents[id]["hasmax"] = true
			end
		end
		CustomNetTables:SetTableValue("playerstalents", tostring(id), playerstalents[id])
	end
end

function wodatalents:OnHeroLevelUp(keys)
    wodatalents:AddPointTalent(keys.PlayerID, 1)
end


function wodatalents:talent_learn(params)
	if params.PlayerID == nil then return end

	local hero = PlayerResource:GetSelectedHeroEntity(params.PlayerID)
	if hero == nil then return end

    if hero:GetUnitName() == "npc_dota_hero_chen" then
        if playerstalents[params.PlayerID]["modifier_chen_1"] ~= nil then
            if params.talentname == "modifier_chen_15" then return end
            if params.talentname == "modifier_chen_8" then return end
        elseif playerstalents[params.PlayerID]["modifier_chen_8"] ~= nil then
            if params.talentname == "modifier_chen_15" then return end
            if params.talentname == "modifier_chen_1" then return end
        elseif playerstalents[params.PlayerID]["modifier_chen_15"] ~= nil then
            if params.talentname == "modifier_chen_8" then return end
            if params.talentname == "modifier_chen_1" then return end
        end
    end

    if hero:GetUnitName() == "npc_dota_hero_dragon_knight" then
        if playerstalents[params.PlayerID]["modifier_dragon_knight_1"] ~= nil then
            if params.talentname == "modifier_dragon_knight_15" then return end
            if params.talentname == "modifier_dragon_knight_8" then return end
        elseif playerstalents[params.PlayerID]["modifier_dragon_knight_8"] ~= nil then
            if params.talentname == "modifier_dragon_knight_15" then return end
            if params.talentname == "modifier_dragon_knight_1" then return end
        elseif playerstalents[params.PlayerID]["modifier_dragon_knight_15"] ~= nil then
            if params.talentname == "modifier_dragon_knight_8" then return end
            if params.talentname == "modifier_dragon_knight_1" then return end
        end
    end

    if hero:GetUnitName() == "npc_dota_hero_lone_druid" then
        if playerstalents[params.PlayerID]["modifier_lone_druid_1"] ~= nil then
            if params.talentname == "modifier_lone_druid_17" then return end
        elseif playerstalents[params.PlayerID]["modifier_lone_druid_17"] ~= nil then
            if params.talentname == "modifier_lone_druid_1" then return end
        end
    end

    if hero:GetUnitName() == "npc_dota_hero_windrunner" then
        if playerstalents[params.PlayerID]["modifier_windrunner_19"] ~= nil then
            if params.talentname == "modifier_windrunner_7" then return end
        elseif playerstalents[params.PlayerID]["modifier_windrunner_7"] ~= nil then
            if params.talentname == "modifier_windrunner_19" then return end
        end
    end

    if hero:GetUnitName() == "npc_dota_hero_kez" then
        if playerstalents[params.PlayerID]["modifier_kez_1"] ~= nil then
            if params.talentname == "modifier_kez_8" then return end
        elseif playerstalents[params.PlayerID]["modifier_kez_8"] ~= nil then
            if params.talentname == "modifier_kez_1" then return end
        end
    end

    if hero:GetUnitName() == "npc_dota_hero_zuus" then
        if playerstalents[params.PlayerID]["modifier_zuus_1"] ~= nil then
            if params.talentname == "modifier_zuus_19" then return end
        elseif playerstalents[params.PlayerID]["modifier_zuus_19"] ~= nil then
            if params.talentname == "modifier_zuus_1" then return end
        end
    end

	if wodatalents:FindTalent(params.talentname, hero:GetUnitName()) then
		return
	end

	if hero.cooldown_talents == nil then
		hero.cooldown_talents = false

		Timers:CreateTimer(0.2, function()
			hero.cooldown_talents = nil
		end)

		if playerstalents[params.PlayerID][params.talentname] == nil then
			playerstalents[params.PlayerID][params.talentname] = {}
		end

		if playerstalents[params.PlayerID][params.talentname]["level"] ~= nil then
			if tonumber(playerstalents[params.PlayerID][params.talentname]["level"]) >= wodatalents:FindTalentMaxLevel(params.talentname, hero:GetUnitName()) then
				return
			end
		end

		if playerstalents[params.PlayerID]["talantpoints"] ~= nil then
			if tonumber(playerstalents[params.PlayerID]["talantpoints"]) <= 0 then
				return
			end
		end

		if playerstalents[params.PlayerID][params.talentname]["level"] == nil then
			playerstalents[params.PlayerID][params.talentname]["level"] = 1
		else
			playerstalents[params.PlayerID][params.talentname]["level"] = playerstalents[params.PlayerID][params.talentname]["level"] + 1
		end

		if playerstalents[params.PlayerID][params.attribute] == nil then
			playerstalents[params.PlayerID][params.attribute] = 1
		else
			playerstalents[params.PlayerID][params.attribute] = playerstalents[params.PlayerID][params.attribute] + 1
		end

		if playerstalents[params.PlayerID]["talantpoints"] == nil then
			playerstalents[params.PlayerID]["talantpoints"] = 0
		else
			playerstalents[params.PlayerID]["talantpoints"] = playerstalents[params.PlayerID]["talantpoints"] - 1
		end

		CustomNetTables:SetTableValue("playerstalents", tostring(params.PlayerID), playerstalents[params.PlayerID])
		
		Timers:CreateTimer(0,function()	
			if hero and not hero:IsAlive() then return 0.1 end
			local modifier_talent = hero:AddNewModifier(hero, nil, params.talentname, {})
		end)
	end
end

function wodatalents:FindTalentMaxLevel(ftalent, fhero)
	for attribute,attribute_skilltable in pairs(herotalents[tostring(fhero)]) do 
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

function wodatalents:FindTalent(ftalent, fhero)
	for attribute,attribute_skilltable in pairs(herotalents[tostring(fhero)]) do 
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