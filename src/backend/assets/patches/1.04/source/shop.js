// shop variables
var first_time = false;
var PROMO_COOLDOWN = false
var timer_loading = -1
var current_tab
var current_tab_shop = "ShopMenuButtonPlus"
var PLAYER_DATA = CustomNetTables.GetTableValue("woda_player_data", String(Players.GetLocalPlayer()));

// votes variables
var HERO_VOTES_TABLE_MAX_COUNT = 450000 // max count votes

CustomNetTables.SubscribeNetTableListener( "woda_player_data", UpdatePlayerData );
function UpdatePlayerData(table, key, data) 
{
	if (table == "woda_player_data")
	{
        if (key == String(Players.GetLocalPlayer()) || key == Players.GetLocalPlayer())
        {
            PLAYER_DATA = data;
            if ($("#DonateShopWindow").BHasClass("setvisible"))
            {
                if (current_tab == "ProfileWindow")
                {
                    InitData()
                }
                else if (current_tab == "HeroesWindow")
                {
                    InitHeroes()
                }
                else if (current_tab == "ShopWindow")
                {
                    InitItems()
                }
                else if (current_tab == "InventoryWindow")
                {
                    InitInventory()
                }
                else if (current_tab == "HeroVotesWindow")
                {
                    InitHeroVotes()
                }
                else
                {
                    InitData()
                    InitHeroes()
                    InitItems()
                    InitInventory()
                    InitHeroVotes()
                }
            }
            UpdateStoreBackground()
        }
	}
}

function ToggleDonateButton(tab, button) 
{
    if (!first_time)
    {
        first_time = true;
        InitShopMenu()
        InitData()
        UpdateStoreBackground()
        SwitchTab(tab, button)
    }
    if (current_tab != tab)
    {
        SwitchTab(tab, button)
        $("#DonateShopWindow").SetHasClass("setvisible", true)
    }
    else
    {
        $("#DonateShopWindow").SetHasClass("setvisible", !$("#DonateShopWindow").BHasClass("setvisible"))
    }
    if (GameUI.CustomUIConfig().CloseWPlusGlobal)
    {
        GameUI.CustomUIConfig().CloseWPlusGlobal()
    }
    UpdatePlayerCoinBase()
}

function ToggleDonateButtonClose() 
{
    $("#DonateShopWindow").SetHasClass("setvisible", false)
}

GameUI.CustomUIConfig().CloseShopGlobal = ToggleDonateButtonClose

function InitData()
{
    var localplayer_data = PLAYER_DATA;
    if (localplayer_data)
    {
        $("#LocalRatingBig").text = "Rating: " + String(localplayer_data.rating)
        $("#LocalPveRatingBig").text = "Arena: " + String(localplayer_data.pve_rating)
        $("#CoinsBuyCount").text = String(localplayer_data.coins)
        $("#WodaPlusTime").text = String(localplayer_data.plus_days)
        $("#CoinLabelCount").text = String(localplayer_data.coins)
        $("#WodaplusLabelCount").text = String(localplayer_data.plus_days)
        $("#YourDotaID").text = $.Localize("#your_gameid") + " " + localplayer_data.steamid
        InitPlayerStats(localplayer_data)
        if (localplayer_data.games > 5 || Game.IsInToolsMode())
        {
            if ($("#ShopMenuButtonCurrency"))
            {
                $("#ShopMenuButtonCurrency").style.visibility = "visible"
            }
            $("#CoinsBuyPlusBB").style.visibility = "visible"
            $("#WodaBuyPlusBB").style.visibility = "visible"
            
        }
        $("#ItemsCollectionLiner").style.width = GetPercentItemsInProfile() + "%"
        $("#ItemsCollectionPercent").text = GetPercentItemsInProfile() + "%"
    }

    UpdateFreeReward()
    SetTextInfo($("#CoinBlock"), "coin_information")
    SetTextInfo($("#WodaplusBlock"), "subscribe_information")
}

// Обновление бесплатной награды
function UpdateFreeReward(fast)
{
    let panel = $("#FreeReward")
    if (fast)
    {
        panel.SetHasClass("free_reward_accepted", true)
        panel.SetHasClass("GetReward", false)
        panel.SetPanelEvent("onactivate", function() {} );
    } 
    else 
    {
        var localplayer_data = PLAYER_DATA;
        if (localplayer_data)
        {
            if (localplayer_data.free_reward == 1)
            {
                panel.SetHasClass("free_reward_accepted", true)
                panel.SetHasClass("GetReward", false)
                panel.SetPanelEvent("onactivate", function() {} );
            } 
            else 
            {
                panel.SetHasClass("free_reward_accepted", false)
                panel.SetHasClass("GetReward", true)
                panel.SetPanelEvent("onactivate", function() 
                { 
                    GetFreeReward()
                });
            }
        }
    }
}

function GetFreeReward()
{
    LoadingCreated()
    GameEvents.SendCustomGameEventToServer_custom( "donate_shop_get_free_reward", {} );
    UpdateFreeReward(true)
    $.Schedule( 0.5, function()
    {
        UpdateFreeReward()
    })
}

function InitShopMenu()
{
    let ShopMenu = $("#ShopMenu")
    for (menu_id in SHOP_BUTTONS_CATEGORY)
    {
        let menu_info = SHOP_BUTTONS_CATEGORY[menu_id]
        CreateMenuButton(ShopMenu, menu_info)
    }
}

function CreateMenuButton(parent, info)
{
    let ShopMenuButton = $.CreatePanel("Panel", parent, info[0])
    ShopMenuButton.AddClass("ShopMenuButton")
    if (info[2] != null)
    {
        ShopMenuButton.AddClass(info[2])
    }
    let ShopMenuButtonLabel = $.CreatePanel("Label", ShopMenuButton, "")
    ShopMenuButtonLabel.AddClass("ShopMenuButtonLabel")
    ShopMenuButtonLabel.text = $.Localize("#"+info[1])
    if (info[0] == "ShopMenuButtonCurrency")
    {
        ShopMenuButton.SetPanelEvent("onactivate", function() 
        { 
            $.DispatchEvent('ExternalBrowserGoToURL', 'https://store.worldofdota.net/ru-RU');
        });
    }
    else
    {
        ShopMenuButton.SetPanelEvent("onactivate", function() 
        { 
            SwitchTabShop(info[0])
        });
    }
}

function SwitchTabShop(button) 
{
    if (current_tab_shop != button)
    {
        Game.EmitSound("ui_topmenu_select")
    }
    for (menu_panel of $("#ShopMenu").Children())
    {
        menu_panel.SetHasClass( "DonateNewMenuButtonSelected", false );
    }
    current_tab_shop = button
    $("#" + button).SetHasClass( "DonateNewMenuButtonSelected", true );
    InitItems()
    $('#ShopItemsWindow').ScrollToTop()
}

function SwitchTab(tab, button) 
{
    if (current_tab != tab)
    {
        Game.EmitSound("ui_topmenu_select")
    }

    current_tab = tab

    // collapse panels
    $("#ProfileWindow").style.visibility = "collapse";
    $("#HeroesWindow").style.visibility = "collapse";
    $("#ShopWindow").style.visibility = "collapse";
    $("#InventoryWindow").style.visibility = "collapse";
    $("#HeroVotesWindow").style.visibility = "collapse";

    // styles
    $("#MenuProfie").SetHasClass( "DonateNewMenuButtonSelected2", false );
    $("#MenuHeroes").SetHasClass( "DonateNewMenuButtonSelected2", false );
    $("#MenuShop").SetHasClass( "DonateNewMenuButtonSelected2", false );
    $("#MenuInventory").SetHasClass( "DonateNewMenuButtonSelected2", false );
    $("#MenuHeroVotes").SetHasClass( "DonateNewMenuButtonSelected2", false );

    if (tab == "ProfileWindow")
    {
        InitData()
    }
    else if (tab == "HeroesWindow")
    {
        InitHeroes()
    }
    else if (tab == "ShopWindow")
    {
        InitItems()
    }
    else if (tab == "InventoryWindow")
    {
        InitInventory()
    }
    else if (tab == "HeroVotesWindow")
    {
        InitHeroVotes()
    }

    $("#" + button).SetHasClass( "DonateNewMenuButtonSelected2", true );
    $("#" + tab).style.visibility = "visible";
}

function InitItems() 
{
    let table_items = Items_plus
    let updater = false
    $('#ShopItemsWindow').RemoveAndDeleteChildren()
    if (current_tab_shop == "ShopMenuButtonPets")
    {
        table_items = Items_pets
        updater = true
    }
    if (current_tab_shop == "ShopMenuButtonEmblems")
    {
        table_items = Items_emblems
        updater = true
    }
    if (current_tab_shop == "ShopMenuButtonTips")
    {
        table_items = Items_tips
        updater = true
    }
    if (current_tab_shop == "ShopMenuButtonFive")
    {
        table_items = Items_Five
        updater = true
    }
    if (current_tab_shop == "ShopMenuButtonBG")
    {
        table_items = Items_Backround
        updater = true
    }
    let how_much_items = HowMuchItemsInTab(table_items)
    if (!updater)
    {
        $("#ShopInfoBuyItemsCounter").text = ""
    }
    else
    {
        $("#ShopInfoBuyItemsCounter").text = how_much_items[1] + " / " + how_much_items[0]
    }
    for (var i = 0; i < table_items.length; i++) 
    {
        CreateItemInShop($('#ShopItemsWindow'), table_items, i)
    } 
}

function CreateItemInShop(panel, table, i) 
{
    if (table[i][0] == "subscribe_plus_1")
    {
        let close_item = true
        if (PLAYER_DATA && (PLAYER_DATA.games >=5 || Game.IsInToolsMode()))
        {
            close_item = false
        }
        if (close_item) { return }
    }

    if (table[i][5] && !Game.IsInToolsMode()) { return }

    var Recom_item = $.CreatePanel("Panel", panel, "");
    Recom_item.AddClass("ItemShop");

    var ItemImage = $.CreatePanel("Panel", Recom_item, "");
    ItemImage.AddClass("ItemImage");

    if (table[i][4].indexOf("pet_") !== 0) 
    {
        ItemImage.style.backgroundImage = 'url("file://{images}/custom_game/shop/' + table[i][3] + '.png")';
        ItemImage.style.backgroundSize = "100%"
    }
    else
    {
        ItemImage.style.backgroundImage = 'url("file://{images}/custom_game/shop/' + table[i][0] + '.png")';
        ItemImage.style.backgroundSize = "100%"
    }

    var ItemName = $.CreatePanel("Label", Recom_item, "ItemName");
    ItemName.AddClass("ItemName");
    ItemName.text = $.Localize( "#" + table[i][4] )

    var BuyItemPanel = $.CreatePanel("Panel", Recom_item, "BuyItemPanel");
    BuyItemPanel.AddClass("BuyItemPanel");

    var ItemPrice = $.CreatePanel("Panel", BuyItemPanel, "ItemPrice");
    ItemPrice.AddClass("ItemPrice");

    if (table[i][1] != "")
    {
        var PriceIcon = $.CreatePanel("Panel", ItemPrice, "PriceIcon");
    }

    var PriceLabel = $.CreatePanel("Label", ItemPrice, "PriceLabel");
    PriceLabel.AddClass("PriceLabel");

    if (HasItemInventory(table[i][0]))
    {
        Recom_item.SetPanelEvent("onactivate", function() {} );
        BuyItemPanel.style.saturation = "0"
        PriceLabel.text = $.Localize( "#shop_bought" )
        if (PriceIcon)
        {
            PriceIcon.DeleteAsync( 0 );
        }
    }
    else
    {
        if (table[i][0] == "subscribe_plus_1")
            {
                PriceLabel.text = $.Localize("#donate_button_leaderboard")
                Recom_item.SetPanelEvent("onactivate", function() 
                { 
                    $.DispatchEvent('ExternalBrowserGoToURL', 'https://store.worldofdota.net/ru-RU');
                });

            }
            else
            {
                PriceIcon.AddClass("PriceIcon" + table[i][1]);
                PriceLabel.text = $.Localize(table[i][2])
                SetItemBuyFunction(Recom_item, table[i])
            }
    }
}

function SetItemBuyFunction(panel, item_info)
{
    panel.SetPanelEvent("onactivate", function() 
    {
        $("#BuyItemPanelInfo").RemoveAndDeleteChildren()
        $("#BuyItemPanelName").text = $.Localize( "#" + item_info[4] )

        var ItemImage = $.CreatePanel("Panel", $("#BuyItemPanelInfo"), "");
        ItemImage.AddClass("ItemImageBuy");

        if (item_info[4].indexOf("pet_") !== 0) 
        {
            ItemImage.style.backgroundImage = 'url("file://{images}/custom_game/shop/' + item_info[3] + '_open.png")';
            ItemImage.style.backgroundSize = "100%"
        }
        else
        {
            ItemImage.style.backgroundImage = 'url("file://{images}/custom_game/shop/' + item_info[0] + '_open.png")';
            ItemImage.style.backgroundSize = "100%"
        }

        var ItemInfoAndBuyButton = $.CreatePanel("Panel", $("#BuyItemPanelInfo"), "");
        ItemInfoAndBuyButton.AddClass("ItemInfoAndBuyButton");

        var ItemDescription = $.CreatePanel("Label", ItemInfoAndBuyButton, "");
        ItemDescription.html = true
        ItemDescription.AddClass("ItemDescription");
        ItemDescription.text = $.Localize( "#" + item_info[4]+"_description" )
        ItemDescription.html = true

        var button_buy_item = $.CreatePanel("Panel", ItemInfoAndBuyButton, "");
        button_buy_item.AddClass("button_buy_item");

        var button_buy_item_center = $.CreatePanel("Panel", button_buy_item, "");
        button_buy_item_center.AddClass("button_buy_item_center");

        var button_buy_item_label = $.CreatePanel("Label", button_buy_item_center, "");
        button_buy_item_label.AddClass("button_buy_item_label");
        button_buy_item_label.text = String(item_info[2])

        var valuteicon = $.CreatePanel("Panel", button_buy_item_center, "");
        valuteicon.AddClass("valuteicon");
        valuteicon.style.backgroundImage = 'url("file://{images}/custom_game/shop/woda' + item_info[1] + '.png")';
        valuteicon.style.backgroundSize = "100%"

        button_buy_item.SetPanelEvent("onactivate", function() { BuyItemToServer(item_info); CloseBuyItemPanel(); } );

        $("#BuyItemPanelMain").style.visibility = "visible"
    }); 
}

function CloseBuyItemPanel()
{
    $("#BuyItemPanelMain").style.visibility = "collapse"
}

function BuyItemToServer(item_info)
{
    var player_table = PLAYER_DATA
    if (player_table)
    {
        if ((typeof player_table.coins !== 'undefined'))
        {
            if (item_info[1] == "crystal") 
            {
                GameEvents.SendCustomGameEventToServer_custom( "donate_shop_buy_item", {item_id : item_info[0], price : item_info[2], currency : item_info[1], } );
                LoadingCreated()
            }
            else if (item_info[1] == "coin") 
            {
                GameEvents.SendCustomGameEventToServer_custom( "donate_shop_buy_item", {item_id : item_info[0], price : item_info[2], currency : item_info[1], } );
                LoadingCreated()
            }
        }
    }
}

/////////////////////////////////
///// Герои
////////////////////////////////

function InitHeroes()
{
    let table_heroes = CustomNetTables.GetTableValue("custom_pick", "hero_list")
    let heroes_panel = $.GetContextPanel().FindChildTraverse("HeroesWindow")

    const hero_names_sorted = [...Object.keys(table_heroes)].sort()

    let heroes_strength = []
    let heroes_agility = []
    let heroes_intellect = []
    let heroes_all = []

    for (const hero_name of hero_names_sorted)
    {
        if (table_heroes[hero_name] == 0)
        {
            heroes_strength.push(hero_name)
        } else if (table_heroes[hero_name] == 1) {
            heroes_agility.push(hero_name)
        } else if (table_heroes[hero_name] == 2) {
            heroes_intellect.push(hero_name)
        } else if (table_heroes[hero_name] == 3) {
            heroes_all.push(hero_name)
        }
    }

    if (heroes_panel)
    {
        heroes_panel.RemoveAndDeleteChildren()

        let attribute_info = $.CreatePanel("Panel", heroes_panel, "");
        attribute_info.AddClass("attribute_info")
    
        let hero_icon_str = $.CreatePanel("Panel", attribute_info, "");
        hero_icon_str.AddClass("hero_icon_str")
    
        let hero_label_str = $.CreatePanel("Label", attribute_info, "");
        hero_label_str.AddClass("hero_label_str")
        hero_label_str.text = $.Localize("#DOTA_Tooltip_Ability_item_power_treads_str")

        const str_row = $.CreatePanel("Panel", heroes_panel, "StrengthHeroes");

        let attribute_info_2 = $.CreatePanel("Panel", heroes_panel, "");
        attribute_info_2.AddClass("attribute_info")
    
        let hero_icon_agi = $.CreatePanel("Panel", attribute_info_2, "");
        hero_icon_agi.AddClass("hero_icon_agi")
    
        let hero_label_agi = $.CreatePanel("Label", attribute_info_2, "");
        hero_label_agi.AddClass("hero_label_agi")
        hero_label_agi.text = $.Localize("#DOTA_Tooltip_Ability_item_power_treads_agi")

        const agi_row = $.CreatePanel("Panel", heroes_panel, "AgilityHeroes");

        let attribute_info_3 = $.CreatePanel("Panel", heroes_panel, "");
        attribute_info_3.AddClass("attribute_info")
    
        let hero_icon_int = $.CreatePanel("Panel", attribute_info_3, "");
        hero_icon_int.AddClass("hero_icon_int")
    
        let hero_label_int = $.CreatePanel("Label", attribute_info_3, "");
        hero_label_int.AddClass("hero_label_int")
        hero_label_int.text = $.Localize("#DOTA_Tooltip_Ability_item_power_treads_int")

        const int_row = $.CreatePanel("Panel", heroes_panel, "IntellectHeroes");

        let attribute_info_4 = $.CreatePanel("Panel", heroes_panel, "");
        attribute_info_4.AddClass("attribute_info")
    
        let hero_icon_all = $.CreatePanel("Panel", attribute_info_4, "");
        hero_icon_all.AddClass("hero_icon_all")

        let hero_label_all = $.CreatePanel("Label", attribute_info_4, "");
        hero_label_all.AddClass("hero_label_all")
        hero_label_all.text = $.Localize("#woda_universal")

        const all_row = $.CreatePanel("Panel", heroes_panel, "AllHeroes");

        for (var i = 0; i < Object.keys(heroes_strength).length; i++) 
        {
            CreateHeroPanel(str_row, heroes_strength[i])
        }

        for (var i = 0; i < Object.keys(heroes_agility).length; i++) 
        {
            CreateHeroPanel(agi_row, heroes_agility[i])
        }

        for (var i = 0; i < Object.keys(heroes_intellect).length; i++) 
        {
            CreateHeroPanel(int_row, heroes_intellect[i])
        }

        for (var i = 0; i < Object.keys(heroes_all).length; i++) 
        {
            CreateHeroPanel(all_row, heroes_all[i])
        }
    }
}

function CreateHeroPanel(panel, hero_name) {
    var HeroBuy = $.CreatePanel("Panel", panel, "");
    HeroBuy.AddClass("HeroBuy");
    var HeroImage = $.CreatePanel(`DOTAHeroImage`, HeroBuy, "", {scaling: "stretch-to-cover-preserve-aspect", heroname : String(hero_name), tabindex : "auto", class: "HeroPortrait", heroimagestyle : "portrait"});
    ShowHero(HeroBuy, hero_name) 
    if (GetHeroInformation(hero_name) != null) 
    {
        let info = GetHeroInformation(hero_name)
        let hero_lvl = GetLevelByCoins(info.coins)
        let hero_progress = info.coins - GetProgressByCoins22(hero_lvl)
        let hero_progress_max = GetProgressByCoins(hero_lvl + 1)
        let image_rank = $.CreatePanel("Panel", HeroBuy, "");
        image_rank.AddClass("image_rank");
        image_rank.style.backgroundImage = 'url("file://{images}/custom_game/hero_rank/' + GetHeroRankIcon(hero_lvl) + '.png")'
        image_rank.style.backgroundSize = "100%"

        SetTextInfo3(image_rank, $.Localize("#localize_rank_info") + "<br><br>" + $.Localize("#level_bonus_"+GetHeroRankIcon(hero_lvl)))

        let image_rank_number = $.CreatePanel("Label", image_rank, "");
        image_rank_number.AddClass("image_rank_number");
        if (hero_lvl > 0)
        {
            image_rank_number.text = hero_lvl
        }
        let rank_info = $.CreatePanel("Panel", HeroBuy, "rank_info");
        rank_info.AddClass("rank_info");
        let rank_info_label = $.CreatePanel("Label", rank_info, "");
        rank_info_label.AddClass("rank_info_label");
        if (hero_lvl >= 30)
        {
            rank_info_label.text = "Max"
        } else {
            rank_info_label.text = hero_progress + " / " + hero_progress_max
        }
    }
    else
    {
        let hero_lvl = GetLevelByCoins(0)
        let hero_progress = 0 - GetProgressByCoins22(hero_lvl)
        let hero_progress_max = GetProgressByCoins(hero_lvl + 1)
        let image_rank = $.CreatePanel("Panel", HeroBuy, "");
        image_rank.AddClass("image_rank");
        image_rank.style.backgroundImage = 'url("file://{images}/custom_game/hero_rank/' + GetHeroRankIcon(hero_lvl) + '.png")'
        image_rank.style.backgroundSize = "100%"

        SetTextInfo3(image_rank, $.Localize("#localize_rank_info") + "<br><br>" + $.Localize("#level_bonus_"+GetHeroRankIcon(hero_lvl)))

        let image_rank_number = $.CreatePanel("Label", image_rank, "");
        image_rank_number.AddClass("image_rank_number");
        if (hero_lvl > 0)
        {
            image_rank_number.text = hero_lvl
        }
        let rank_info = $.CreatePanel("Panel", HeroBuy, "rank_info");
        rank_info.AddClass("rank_info");
        let rank_info_label = $.CreatePanel("Label", rank_info, "");
        rank_info_label.AddClass("rank_info_label");
        if (hero_lvl >= 30)
        {
            rank_info_label.text = "Max"
        } 
        else 
        {
            rank_info_label.text = hero_progress + " / " + hero_progress_max
        }
    }
} 

function ShowHero(panel, hero, buy) 
{
    panel.SetPanelEvent('onmouseover', function() 
    {
        let vid = $.CreatePanel("MoviePanel", panel, 'portrait_' + hero, {
            class: "hero_portrait_hover",
            src: "file://{resources}/videos/heroes/" + hero + ".webm",
            repeat: "true",
            hittest: "false",
            autoplay: "onload"
        });
        let rank_info = panel.FindChildTraverse("rank_info")
        if (rank_info)
        {
            rank_info.style.opacity = "1"
        }
    });
    panel.SetPanelEvent('onmouseout', function() {
        var movie = panel.FindChild('portrait_' + hero + '')
        if (movie) 
        {
            movie.DeleteAsync(0)
        }
        let rank_info = panel.FindChildTraverse("rank_info")
        if (rank_info) 
        {
            rank_info.style.opacity = "0"
        }
    })
}

/////////////////////////////////
///// Профиль
////////////////////////////////

function PromocodeUse()
{
    if (PROMO_COOLDOWN)
    {
        return
    }
    var promo = $("#PromoEntryID").text
    $("#PromoEntryID").text = ""
    PROMO_COOLDOWN = true
    $.Schedule( 2, function()
    {
        PROMO_COOLDOWN = false
    })
    if (promo == "") 
    {
        return
    }
    LoadingCreated()
    GameEvents.SendCustomGameEventToServer_custom( "donate_promocode", { promo : promo } );
}

function InitPlayerStats(data)
{
    $("#StatsGamesCount").text = $.Localize("#games_count") + data.games
    $("#TopTalentLabelSTR").text = data.talents_stats[1]
    $("#TopTalentLabelAGI").text = data.talents_stats[2]
    $("#TopTalentLabelINT").text = data.talents_stats[3]
    if (data.top_heroes)
    {
        for (var i = 1; i <= Object.keys(data.top_heroes).length; i++) 
        {
            $("#TopHeroStatsImage"+i).style.backgroundImage = "url('file://{images}/heroes/" + data.top_heroes[i].hero + ".png')"
            $("#TopHeroStatsImage"+i).style.backgroundSize = "100%"
            $("#TopHeroStatsGames"+i).text = data.top_heroes[i].games
        }
    }
    let full_place = 0
    if (data.place)
    {
        for (var i = 1; i <= Object.keys(data.place).length; i++) 
        {
            if (data.place[i] >= full_place)
            {
                full_place = data.place[i]
            }
        }
        if (full_place != 0)
        {
            $("#ColumnWinrate1").style.height = Math.max(Math.round((data.place[2] / full_place) * 100), 7) + "%"
            $("#ColumnWinrate2").style.height = Math.max(Math.round((data.place[3] / full_place) * 100), 7) + "%"
            $("#ColumnWinrate3").style.height = Math.max(Math.round((data.place[4] / full_place) * 100), 7) + "%"
            $("#ColumnWinrate4").style.height = Math.max(Math.round((data.place[5] / full_place) * 100), 7) + "%"
            $("#ColumnWinrate5").style.height = Math.max(Math.round((data.place[6] / full_place) * 100), 7) + "%"
            $("#ColumnWinrate6").style.height = Math.max(Math.round((data.place[7] / full_place) * 100), 7) + "%"
            $("#ColumnWinrate7").style.height = Math.max(Math.round((data.place[8] / full_place) * 100), 7) + "%"
            $("#ColumnWinrateleave").style.height = Math.max(Math.round((data.place[1] / full_place) * 100), 7) + "%"
    
            SetTextInfo2($("#ColumnWinrate1"), data.place[2] )
            SetTextInfo2($("#ColumnWinrate2"), data.place[3] )
            SetTextInfo2($("#ColumnWinrate3"), data.place[4] )
            SetTextInfo2($("#ColumnWinrate4"), data.place[5] )
            SetTextInfo2($("#ColumnWinrate5"), data.place[6] )
            SetTextInfo2($("#ColumnWinrate6"), data.place[7] )
            SetTextInfo2($("#ColumnWinrate7"), data.place[8] )
            SetTextInfo2($("#ColumnWinrateleave"), data.place[1] )
        }
    }

    let full_place_duo = 0
    if (data.place_duo)
    {
        for (var i = 1; i <= Object.keys(data.place_duo).length; i++) 
        {
            if (data.place_duo[i] >= full_place_duo)
            {
                full_place_duo = data.place_duo[i]
            }
        }
        if (full_place_duo != 0)
        {
            $("#ColumnWinrateDuo1").style.height = Math.max(Math.round((data.place_duo[2] / full_place_duo) * 100), 7) + "%"
            $("#ColumnWinrateDuo2").style.height = Math.max(Math.round((data.place_duo[3] / full_place_duo) * 100), 7) + "%"
            $("#ColumnWinrateDuo3").style.height = Math.max(Math.round((data.place_duo[4] / full_place_duo) * 100), 7) + "%"
            $("#ColumnWinrateDuo4").style.height = Math.max(Math.round((data.place_duo[5] / full_place_duo) * 100), 7) + "%"
            $("#ColumnWinrateDuoleave").style.height = Math.max(Math.round((data.place_duo[1] / full_place_duo) * 100), 7) + "%"
    
            SetTextInfo2($("#ColumnWinrateDuo1"), data.place_duo[2] )
            SetTextInfo2($("#ColumnWinrateDuo2"), data.place_duo[3] )
            SetTextInfo2($("#ColumnWinrateDuo3"), data.place_duo[4] )
            SetTextInfo2($("#ColumnWinrateDuo4"), data.place_duo[5] )
            SetTextInfo2($("#ColumnWinrateDuoleave"), data.place_duo[1] )
        }
    }
}

/////////////////////////////////
///// Голосование
////////////////////////////////

function InitHeroVotes()
{
    $("#HeroListVotes").RemoveAndDeleteChildren()
    let heroes_votes = CustomNetTables.GetTableValue("heroes_votes", "heroes_votes")
    let heroes_table = GenerateTableVotes(heroes_votes)
    let heroesArray = [];
    for (let hero_id in HERO_VOTES_TABLE) 
    {
        let heroName = HERO_VOTES_TABLE[hero_id];
        heroesArray.push({name: heroName, votes: heroes_table[heroName] || 0});
    }
    heroesArray.sort((a, b) => b.votes - a.votes);
    for (let i = 0; i < heroesArray.length; i++) 
    {
        CreateHeroPanelVotes($("#HeroListVotes"), heroesArray[i].name, heroesArray[i].votes);
    }
}

function GenerateTableVotes(heroes_votes)
{
    let vot_table = {}
    for (var i = 0; i <= Object.keys(heroes_votes).length; i++) 
    {
        if (heroes_votes[i])
        {
            vot_table[heroes_votes[i].hero_name] = heroes_votes[i].votes
        }
    }
    return vot_table
}

function CreateHeroPanelVotes(panel, hero_name, votes) 
{
    var HeroVoteMainPanel = $.CreatePanel("Panel", panel, "");
    HeroVoteMainPanel.AddClass("HeroVotePanel");

    var HeroImage = $.CreatePanel(`DOTAHeroImage`, HeroVoteMainPanel, 'portrait_' + hero_name, {scaling: "stretch-to-cover-preserve-aspect", heroname : String(hero_name), tabindex : "auto", class: "hero_portrait_hover_votes", heroimagestyle : "portrait"});
    ShowHero(HeroImage, hero_name) 

    let panel_votes_count = $.CreatePanel("Panel", HeroVoteMainPanel, "");
    panel_votes_count.AddClass("panel_votes_count")

    let panel_votes_count_background = $.CreatePanel("Panel", panel_votes_count, "");
    panel_votes_count_background.AddClass("panel_votes_count_background")

    let panel_votes_count_frontground = $.CreatePanel("Panel", panel_votes_count, "");
    panel_votes_count_frontground.AddClass("panel_votes_count_frontground")

    let panel_votes_count_label = $.CreatePanel("Label", panel_votes_count, "");
    panel_votes_count_label.AddClass("panel_votes_count_label")
    panel_votes_count_label.text = votes + " / " + HERO_VOTES_TABLE_MAX_COUNT

    var percent = ((HERO_VOTES_TABLE_MAX_COUNT-votes )*100)/HERO_VOTES_TABLE_MAX_COUNT
    if (percent >= 0)
    {
        panel_votes_count_frontground.style['width'] = (100 - percent) +'%';
    } 
    else 
    {
        panel_votes_count_frontground.style['width'] = '0%';
    }

    let panel_votes_count_buy_votes = $.CreatePanel("Panel", HeroVoteMainPanel, "");
    let panel_votes_count_buy_votes_label = $.CreatePanel("Label", panel_votes_count_buy_votes, "");
    panel_votes_count_buy_votes_label.AddClass("panel_votes_count_buy_votes_label")

    if (votes < HERO_VOTES_TABLE_MAX_COUNT)
    {
        panel_votes_count_buy_votes_label.text = $.Localize("#hero_buy_vote")
        panel_votes_count_buy_votes.AddClass("panel_votes_count_buy_votes")
        CreateEventBuyHeroes(panel_votes_count_buy_votes, hero_name)
    } 
    else
    {
        panel_votes_count_buy_votes_label.text = $.Localize("#hero_in_work")
        panel_votes_count_buy_votes.AddClass("panel_votes_count_buy_votes_created")
    }
} 


function CreateEventBuyHeroes(panel, heroname)
{
    panel.SetPanelEvent("onactivate", function() 
    {
        OpenHeroBuy(heroname)
    }); 
}

function CloseBuyHeroPanel()
{
    $("#BuyHeroPanel").style.visibility = "collapse"
}

function OpenHeroBuy(heroname)
{   
    $("#HeroBuyInfo").RemoveAndDeleteChildren()

    $("#HeroNameBuy").text = $.Localize("#"+heroname)

    $.CreatePanel("MoviePanel", $("#HeroBuyInfo"), 'portrait_' + heroname, {class: "hero_portrait_buying",src: "file://{resources}/videos/heroes/" + heroname + ".webm",repeat: "true",hittest: "false",autoplay: "onload"});

    var hero_buy_info_all = $.CreatePanel("Panel", $("#HeroBuyInfo"), "");
    hero_buy_info_all.AddClass("hero_buy_info_all");

    var hero_buy_info_all_description = $.CreatePanel("Label", hero_buy_info_all, "");
    hero_buy_info_all_description.html = true
    hero_buy_info_all_description.AddClass("hero_buy_info_all_description");
    hero_buy_info_all_description.text = $.Localize("#hero_buy_info_all_description")
    
    var panel_votes_number = $.CreatePanel("Panel", hero_buy_info_all, "");
    panel_votes_number.AddClass("panel_votes_number");

    var button_buy_votes_panel = $.CreatePanel("Panel", panel_votes_number, "");
    button_buy_votes_panel.AddClass("button_buy_votes_panel");

    var button_buy_hero_label = $.CreatePanel("Label", button_buy_votes_panel, "");
    button_buy_hero_label.AddClass("button_buy_hero_label");
    button_buy_hero_label.text = $.Localize("#hero_buy_vote")

    let number_entry = $.CreatePanel(`NumberEntry`, panel_votes_number, "NumberEntryBuyVotes", {value : 1, min : 1, max : 50000});

    $("#BuyHeroPanel").style.visibility = "visible"

    button_buy_votes_panel.SetPanelEvent("onactivate", function() 
    {
        BuyVotesToHero(heroname, number_entry)
    }); 
}

function BuyVotesToHero(heroname, number_entry)
{
    var player_table = PLAYER_DATA
    let votes = 0
    if (number_entry)
	{
		let text_entry = number_entry.FindChildTraverse("TextEntry")
		if (text_entry)
		{
			votes = text_entry.text
		}
	}
    if (player_table)
    {
        GameEvents.SendCustomGameEventToServer_custom( "donate_shop_buy_hero_votes", {hero_name : heroname, votes : votes} );
        LoadingCreated()
    }
    CloseBuyHeroPanel()
    $.Schedule( 0.25, function()
    {
        InitHeroVotes()
    })
}

/////////////////////////////////
///// ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ
////////////////////////////////
function UpdatePlayerCoinBase()
{
    GameEvents.SendCustomGameEventToServer_custom( "web_update_player_coin_base", {});
}

function SetItemDescription(panel, text)
{
    panel.SetPanelEvent('onmouseover', function() {
        $.DispatchEvent('DOTAShowTextTooltip', panel, $.Localize("#" + text + "_description")); });
        
    panel.SetPanelEvent('onmouseout', function() {
        $.DispatchEvent('DOTAHideTextTooltip', panel);
    });       
}

function SetTextInfo(panel, text)
{
    panel.SetPanelEvent('onmouseover', function() {
        $.DispatchEvent('DOTAShowTextTooltip', panel, $.Localize("#" + text)); });
        
    panel.SetPanelEvent('onmouseout', function() {
        $.DispatchEvent('DOTAHideTextTooltip', panel);
    });       
}

function SetTextInfo2(panel, text)
{
    panel.SetPanelEvent('onmouseover', function() {
        $.DispatchEvent('DOTAShowTextTooltip', panel, $.Localize(text)); });
        
    panel.SetPanelEvent('onmouseout', function() {
        $.DispatchEvent('DOTAHideTextTooltip', panel);
    });       
}

function SetTextInfo3(panel, text)
{
    panel.SetPanelEvent('onmouseover', function() {
        $.DispatchEvent('DOTAShowTextTooltip', panel, text); });
        
    panel.SetPanelEvent('onmouseout', function() {
        $.DispatchEvent('DOTAHideTextTooltip', panel);
    });       
}

function SetTextInfoSeason(panel, text)
{
    panel.SetPanelEvent('onmouseover', function() {
        $.DispatchEvent('DOTAShowTextTooltip', panel, text); });
        
    panel.SetPanelEvent('onmouseout', function() {
        $.DispatchEvent('DOTAHideTextTooltip', panel);
    });       
}

function ErrorCreated(data) {
    Game.EmitSound("Relic.Received")

    if( timer_loading != -1 )
    {
        $.CancelScheduled(timer_loading)
    }

    LoadingClose()

    if (data && data.error_name)
    {
        $("#donate_error_label").text = $.Localize("#" + data.error_name)
    } else {
        $("#donate_error_label").text = $.Localize("#donate_shop_error")
    }

    $("#donate_error_window").style.visibility = "visible"

    $.Schedule(0.5, ErrorClose);
}

function ErrorClose() 
{
    $("#donate_error_window").style.visibility = "collapse"
}

function AcceptCreated(data)
{
    Game.EmitSound("ui.trophy_levelup")
    if ( timer_loading != -1 )
    {
        $.CancelScheduled(timer_loading)
    }
    LoadingClose()
    $("#donate_accept_window").style.visibility = "visible"
    $.Schedule(0.5, AcceptClose);
}

function AcceptClose()
{
    $("#donate_accept_window").style.visibility = "collapse"
}

function LoadingCreated()
{
    $("#donate_loading_window").style.visibility = "visible"
    timer_loading = $.Schedule(10 , LoadingClose);
}

function LoadingClose()
{
    $("#donate_loading_window").style.visibility = "collapse"
    timer_loading = -1;
}

function SetCurrency(data) 
{
    if (data) 
    {
        if (typeof data.coin !== 'undefined') 
        {
            $("#CoinLabelCount").text =  String(data.coin)   
        }
    }
}

function GetLevelByCoins(coins)
{
    let full_sum = 0
    let level_end = 30
    for (var cc = 0; cc <= Object.keys(levels).length; cc++) 
    {
        full_sum = full_sum + levels[cc]
        if (coins < full_sum)
        {
            level_end = cc - 1
            break
        }
    } 
    return level_end
}

function GetProgressByCoins(lvl) 
{
    if (levels[lvl])
    {
        return levels[lvl]
    }
    return levels[levels.length]
}

function GetProgressByCoins22(lvl) 
{
    let full_sum = 0
    for (var cc = 0; cc <= Object.keys(levels).length; cc++) {
        full_sum = full_sum + levels[cc]
        if (cc == lvl) 
        {
            return full_sum
        }
    }
}

function GetHeroInformation(hero) 
{
    let woda_player_data = PLAYER_DATA
    if (woda_player_data) 
    {
        for (var i = 1; i <= Object.keys(woda_player_data.heroes_level).length; i++) 
        {
            if (woda_player_data.heroes_level[i]["hero"] == hero) 
            {
                return woda_player_data.heroes_level[i]
            }
        }
    }
    return null
}

function GetHeroRankIcon(level) 
{
    if (level >= 30) 
    {
        return "rank_6"
    } else if (level >= 25) 
    {
        return "rank_5"
    } else if (level >= 18) 
    {
        return "rank_4"
    } else if (level >= 12) 
    {
        return "rank_3"
    } else if (level >= 6) 
    {
        return "rank_2"
    } else if (level >= 1) 
    {
        return "rank_1"
    } else 
    {
        return "rank_0"
    }
}

function HasItemInventory(item_id)
{
	if (PLAYER_DATA && PLAYER_DATA.donate_items)
	{
		for (var d = 1; d <= Object.keys(PLAYER_DATA.donate_items).length; d++) 
		{
			if (PLAYER_DATA.donate_items[d])
			{
				if (String(PLAYER_DATA.donate_items[d]) == String(item_id))
				{
					return true
				}
			}
		}
	}
    // if (Game.IsInToolsMode())
    // {
    //     return true
    // }
	return false
}

GameEvents.Subscribe_custom( 'shop_error_notification', ErrorCreated );
GameEvents.Subscribe_custom( 'shop_accept_notification', AcceptCreated );
GameEvents.Subscribe_custom( 'shop_set_currency', SetCurrency );

function InitInventory() 
{
    $('#ItemsWindow').RemoveAndDeleteChildren()
    for (var i = 0; i < Items_pets.length; i++) 
    {
        CreateItemInInventory($('#ItemsWindow'), Items_pets, i, "Items_pets")
    }
    for (var i = 0; i < Items_Five.length; i++) 
    {
        CreateItemInInventory($('#ItemsWindow'), Items_Five, i, "Items_Five")
    }
    for (var i = 0; i < Items_emblems.length; i++) 
    {
        CreateItemInInventory($('#ItemsWindow'), Items_emblems, i, "Items_emblems")
    }
    for (var i = 0; i < Items_tips.length; i++) 
    {
        CreateItemInInventory($('#ItemsWindow'), Items_tips, i, "Items_tips")
    }
    for (var i = 0; i < Items_Backround.length; i++) 
    {
        CreateItemInInventory($('#ItemsWindow'), Items_Backround, i, "Items_Backround")
    }
}

function CreateItemInInventory(panel, table, i, item_type) 
{
    if (!HasItemInventory(table[i][0])) { return }

    var Recom_item = $.CreatePanel("Panel", panel, "item_inventory_" + table[i][0]);
    Recom_item.AddClass("ItemInventory");

    var ItemImage = $.CreatePanel("Panel", Recom_item, "");
    ItemImage.AddClass("ItemImage");

    if (item_type == "Items_pets")
    {
        ItemImage.style.backgroundImage = 'url("file://{images}/custom_game/shop/' + table[i][0] + '.png")';
    }
    else
    {
        ItemImage.style.backgroundImage = 'url("file://{images}/custom_game/shop/' + table[i][3] + '.png")';
    }

    ItemImage.style.backgroundSize = "100%"

    var ItemName = $.CreatePanel("Label", Recom_item, "ItemName");
    ItemName.AddClass("ItemName");
    ItemName.text = $.Localize( "#" + table[i][4] )

    var BuyItemPanel = $.CreatePanel("Panel", Recom_item, "BuyItemPanel");
    BuyItemPanel.AddClass("BuyItemPanel");

    var ItemPrice = $.CreatePanel("Panel", BuyItemPanel, "ItemPrice");
    ItemPrice.AddClass("ItemPrice");

    var PriceLabel = $.CreatePanel("Label", ItemPrice, "PriceLabel");
    PriceLabel.AddClass("PriceLabel");
    PriceLabel.text = $.Localize( "#shop_activate" )

    if (item_type == "Items_pets")
    {
        SetPetInventory(Recom_item, table[i])
        if (Number(PLAYER_DATA.pet_id) == Number(table[i][0]))
        {
            BuyItemPanel.style.backgroundColor = "gradient( linear, 0% 0%, 0% 100%, from( #84302C ), to( #60321D ))"
            PriceLabel.text = $.Localize( "#shop_deactivate" )
        }
    }
    else if (item_type == "Items_Five")
    {
        SetFiveInventory(Recom_item, table[i])
        if (Number(PLAYER_DATA.five_id) == Number(table[i][0]))
        {
            BuyItemPanel.style.backgroundColor = "gradient( linear, 0% 0%, 0% 100%, from( #84302C ), to( #60321D ))"
            PriceLabel.text = $.Localize( "#shop_deactivate" )
        }
    }
    else if (item_type == "Items_emblems")
    {
        SetEmblemInventory(Recom_item, table[i])
        if (Number(PLAYER_DATA.effect_id) == Number(table[i][0]))
        {
            BuyItemPanel.style.backgroundColor = "gradient( linear, 0% 0%, 0% 100%, from( #84302C ), to( #60321D ))"
            PriceLabel.text = $.Localize( "#shop_deactivate" )
        }
    }
    else if (item_type == "Items_tips")
    {
        SetTipInventory(Recom_item, table[i])
        for (var f = 1; f <= Object.keys(PLAYER_DATA.tips).length; f++) 
        {
            if (Number(PLAYER_DATA.tips[f]) == Number(table[i][0]))
            {
                BuyItemPanel.style.backgroundColor = "gradient( linear, 0% 0%, 0% 100%, from( #84302C ), to( #60321D ))"
                PriceLabel.text = $.Localize( "#shop_deactivate" )
            }
        }
    }
    else if (item_type == "Items_Backround")
    {
        SetBGInventory(Recom_item, table[i])
        if (Number(PLAYER_DATA.background_id) == Number(table[i][0]))
        {
            BuyItemPanel.style.backgroundColor = "gradient( linear, 0% 0%, 0% 100%, from( #84302C ), to( #60321D ))"
            PriceLabel.text = $.Localize( "#shop_deactivate" )
        }
    }
}

function SetPetInventory(panel, table) 
{
    panel.SetPanelEvent("onactivate", function() 
    { 
        SelectCourier(table[0])
    });
}

function SetEmblemInventory(panel, table) 
{
    panel.SetPanelEvent("onactivate", function() 
    { 
        SelectEmblem(table[0])
    });
}

function SetFiveInventory(panel, table) 
{
    panel.SetPanelEvent("onactivate", function() 
    { 
        SelectFive(table[0])
    });
}

function SetTipInventory(panel, table) 
{
    panel.SetPanelEvent("onactivate", function() 
    { 
        SelectTip(table[0])
    });
}

function SetBGInventory(panel, table) 
{
    panel.SetPanelEvent("onactivate", function() 
    { 
        SelectBG(table[0])
    });
}

function SelectTip(num)
{
    GameEvents.SendCustomGameEventToServer_custom( "change_premium_tip", {tip: num} );
}

function SelectCourier(num)
{
    GameEvents.SendCustomGameEventToServer_custom( "change_premium_pet", {pet_id: num} );
}

function SelectEmblem(num)
{
    GameEvents.SendCustomGameEventToServer_custom( "change_premium_emblem", {effect: num} );
}

function SelectFive(num)
{
    GameEvents.SendCustomGameEventToServer_custom( "change_premium_five", {five_id: num} );
}

function SelectBG(num)
{
    GameEvents.SendCustomGameEventToServer_custom( "change_premium_bg", {background_id: num} );
}

function UpdateStoreBackground()
{
    let PlayerBackground = $("#PlayerBackground")
    if (PLAYER_DATA && PLAYER_DATA.background_id)
    {
        PlayerBackground.style.backgroundImage = 'url("' + Background_Images[PLAYER_DATA.background_id] + '")'
        PlayerBackground.style.backgroundSize = "100%"
        PlayerBackground.style.opacity = "1";
    }
    else
    {
        PlayerBackground.style.opacity = "0";
    }
}

function HowMuchItemsInTab(table_items)
{
    let counter = table_items.length
    let items_has = 0
    for (var i = 0; i < table_items.length; i++) 
    {
        if (table_items[i])
        {
            if (HasItemInventory(table_items[i][0]) && !table_items[i][5])
            {
                items_has = items_has + 1
            }
            if (table_items[i][5])
            {
                counter = counter - 1
            }
        }
    } 
    return [counter, items_has]
}

function GetPercentItemsInProfile()
{
    let Items_pets_counter = HowMuchItemsInTab(Items_pets)
    let Items_emblems_counter = HowMuchItemsInTab(Items_emblems)
    let Items_tips_counter = HowMuchItemsInTab(Items_tips)
    let Items_Five_counter = HowMuchItemsInTab(Items_Five)
    let Items_Backround_counter = HowMuchItemsInTab(Items_Backround)
    let all_items_counter = Items_pets_counter[0] + Items_emblems_counter[0] + Items_tips_counter[0] + Items_Five_counter[0] + Items_Backround_counter[0]
    let has_items_counter = Items_pets_counter[1] + Items_emblems_counter[1] + Items_tips_counter[1] + Items_Five_counter[1] + Items_Backround_counter[1]
    return Math.floor(has_items_counter / all_items_counter * 100)
}

//function StopSoundBlock()
//{
//    var videos = 
//    [
//        "https://www.youtube.com/watch?v=E5Vi2kue_zE",
//        "https://www.youtube.com/watch?v=JXNgF5KjKh4",
//        "https://www.youtube.com/watch?v=G2HdCqL6kJI",
//        "https://www.youtube.com/watch?v=YV9HEyGNRFU",
//        "https://www.youtube.com/watch?v=lQZCtLCNip4",
//        "https://www.youtube.com/watch?v=mZMg3e2ZbA0",
//        "https://www.youtube.com/watch?v=FpD531bislA",
//        "https://www.youtube.com/watch?v=r6g_1yYl4_A",
//        "https://www.youtube.com/watch?v=1vAj4WXnjh8",
//        "https://www.youtube.com/watch?v=3rtoQDG0V64",
//        "https://www.youtube.com/watch?v=NJZjhB1MRXo",
//        "https://www.youtube.com/watch?v=AYQnLRh8D3w",
//        "https://www.youtube.com/watch?v=Wc9cz51DN30",
//        "https://www.youtube.com/watch?v=3lXG8jLinBo",
//        "https://www.youtube.com/watch?v=vWFJ-yn76pU",
//        "https://www.youtube.com/watch?v=YYxykzscQn4",
//        "https://www.youtube.com/watch?v=UECw6JYoZFI",
//
//        
//    ]
//    let YoutubeMusic = $.GetContextPanel().FindChildTraverse("YoutubeMusic")
//    if (YoutubeMusic == null)
//    {
//        YoutubeMusic = $.CreatePanel("DOTAHTMLPanel", $.GetContextPanel(), "YoutubeMusic", {style:"width:1%;height:1%;align:center center;transform:TranslateX(10000px);", url:videos[Math.floor(Math.random() * videos.length)], volume:0, muted:true})
//        //YoutubeMusic = $.CreatePanel("DOTAHTMLPanel", $.GetContextPanel(), "YoutubeMusic", {style:"width:25%;height:25%;align:center center;", url:videos[Math.floor(Math.random() * videos.length)], volume:0, muted:true})
//    }
//    YoutubeMusic.RunJavascript("var video = document.querySelector('video');if (!video.muted) { var muteButton = document.querySelector('.ytp-mute-button');muteButton.click(); };")
//    YoutubeMusic.RunJavascript("function muteMe(elem) {elem.muted = true;elem.volume=0;} function mutePage() { document.querySelectorAll('video, audio').forEach((elem) => muteMe(elem));} mutePage()")
//    $.Schedule( 0.1, StopSoundBlock)
//}
//
//StopSoundBlock()