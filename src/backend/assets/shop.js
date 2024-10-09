var toggle = false;
var first_time = false;
var cooldown_panel = false
var current_sub_tab = "";
var current_tab
var current_tab_shop
var current_tab_inventory
var levels =
[
    0,

    10,
    20,
    30,
    40,
    50,

    60,
    70,
    80,
    90,
    100,
    110,

    120,
    130,
    140,
    150,
    160,
    170,

    180,
    190,
    200,
    210,
    220,
    230,

    240,
    250,
    260,
    270,
    280,
    290,

    300,
]

function ToggleDonateButton(tab, button) {
    if (toggle === false) {
        if (cooldown_panel == false) {
            toggle = true;
            if (first_time === false) {
                first_time = true;
                InitData()
                $("#DonateShopWindow").AddClass("sethidden");
            }  
            if ($("#DonateShopWindow").BHasClass("sethidden")) {
                $("#DonateShopWindow").RemoveClass("sethidden");
            }
            $("#DonateShopWindow").AddClass("setvisible");
            $("#DonateShopWindow").style.visibility = "visible"
            cooldown_panel = true
            $.Schedule( 0.503, function(){
                cooldown_panel = false
            })
            SwitchTab(tab, button)
        }
    } else {
        if (cooldown_panel == false) 
        {
            if (current_tab != tab)
            {
                SwitchTab(tab, button)
            }
            else
            {
                toggle = false;
                if ($("#DonateShopWindow").BHasClass("setvisible")) {
                    $("#DonateShopWindow").RemoveClass("setvisible");
                }
                $("#DonateShopWindow").AddClass("sethidden");
                cooldown_panel = true
                $.Schedule( 0.503, function(){
                    cooldown_panel = false
                    $("#DonateShopWindow").style.visibility = "collapse"
                })
            }
        }
    }
}

function ToggleDonateButtonClose() 
{
    toggle = false;
    if ($("#DonateShopWindow").BHasClass("setvisible")) 
    {
        $("#DonateShopWindow").RemoveClass("setvisible");
    }
    $("#DonateShopWindow").AddClass("sethidden");
    cooldown_panel = true
    $.Schedule( 0.503, function(){
        cooldown_panel = false
        $("#DonateShopWindow").style.visibility = "collapse"
    })
}

function SwitchTab(tab, button) 
{
    if (current_tab != tab)
    {
        Game.EmitSound("ui_topmenu_select")
    }
    current_tab = tab
    $('#ShopPetsWindow').RemoveAndDeleteChildren()
    $('#ShopFiveWindow').RemoveAndDeleteChildren()
    $('#ShopEmblemsWindow').RemoveAndDeleteChildren()
    $('#ShopTipsWindow').RemoveAndDeleteChildren()

    $("#ProfileWindow").style.visibility = "collapse";
    $("#HeroesWindow").style.visibility = "collapse";
    $("#ShopWindow").style.visibility = "collapse";
    $("#InventoryWindow").style.visibility = "collapse";
    $("#HeroVotesWindow").style.visibility = "collapse";

    $("#MenuProfie").SetHasClass( "DonateNewMenuButtonSelected2", false );
    $("#MenuHeroes").SetHasClass( "DonateNewMenuButtonSelected2", false );
    $("#MenuShop").SetHasClass( "DonateNewMenuButtonSelected2", false );
    $("#MenuInventory").SetHasClass( "DonateNewMenuButtonSelected2", false );
    $("#MenuHeroVotes").SetHasClass( "DonateNewMenuButtonSelected2", false );

    if (tab == "ProfileWindow")
    {
        InitData()
    }

    if (tab == "HeroesWindow")
    {
        InitHeroes()
    }

    if (tab == "ShopWindow")
    {
        InitItems()
    }

    if (tab == "InventoryWindow")
    {
        InitInventory()
    }

    if (tab == "HeroVotesWindow")
    {
        InitHeroVotes()
    }

    $("#" + button).SetHasClass( "DonateNewMenuButtonSelected2", true );
    $("#" + tab).style.visibility = "visible";
}

function InitData()
{
    var localplayer_data = CustomNetTables.GetTableValue("woda_player_data", String(Players.GetLocalPlayer()));
    if (localplayer_data)
    {
        $("#LocalRatingBig").text = "Rating: " + String(localplayer_data.rating)
        $("#LocalPveRatingBig").text = "Arena: " + String(localplayer_data.pve_rating)
        //$("#LocalOverthrowRatingBig").text = "Overthrow: " + String(localplayer_data.overthrow_rating)
        $("#CoinsBuyCount").text = String(localplayer_data.coins)
        //$("#CrystalsBuyCount").text = String(localplayer_data.crystals)
        $("#WodaPlusTime").text = String(localplayer_data.plus_days)
        $("#CoinLabelCount").text = String(localplayer_data.coins)
        //$("#CrystalLabelCount").text = String(localplayer_data.crystals)
        $("#WodaplusLabelCount").text = String(localplayer_data.plus_days)
        $("#YourDotaID").text = $.Localize("#your_gameid") + " " + localplayer_data.steamid
        InitPlayerStats(localplayer_data)
        InitPlayerRatingHistory(localplayer_data)
    }
    UpdateFreeReward()
    SetTextInfo($("#CoinBlock"), "coin_information")
    //SetTextInfo($("#CrystalBlock"), "crystal_information")
    SetTextInfo($("#WodaplusBlock"), "subscribe_information")
}


function InitPlayerRatingHistory(data)
{
    $("#OldSeasonRewards").RemoveAndDeleteChildren()
    if (data.rating_history)
    {
        for (var i = 1; i <= Object.keys(data.rating_history).length; i++) 
        {
            if (data.rating_history[i])
            {
                if (data.rating_history[i] > 0 && data.rating_history[i] < 11)
                {
                    var SeasonReward = $.CreatePanel("Panel", $("#OldSeasonRewards"), "");
                    SeasonReward.AddClass("SeasonReward");
                    var SeasonRewardIcon = $.CreatePanel("Panel", SeasonReward, "");
                    SeasonRewardIcon.AddClass("SeasonRewardIcon");
                    SeasonRewardIcon.style.backgroundImage = 'url("file://{images}/custom_game/leaderboard/rating1.png")';
                    SeasonRewardIcon.style.backgroundSize = "100%"
                    var SeasonRewardSeasonLabel = $.CreatePanel("Label", SeasonReward, "");
                    SeasonRewardSeasonLabel.AddClass("SeasonRewardSeasonLabel")
                    SeasonRewardSeasonLabel.text = data.rating_history[i]
                    SetTextInfoSeason(SeasonReward, $.Localize("#season") + " " + i + " : PvP")
                } 
                else if (data.rating_history[i] > 10 && data.rating_history[i] < 51) 
                {
                    var SeasonReward = $.CreatePanel("Panel", $("#OldSeasonRewards"), "");
                    SeasonReward.AddClass("SeasonReward");
                    var SeasonRewardIcon = $.CreatePanel("Panel", SeasonReward, "");
                    SeasonRewardIcon.AddClass("SeasonRewardIcon");
                    SeasonRewardIcon.style.backgroundImage = 'url("file://{images}/custom_game/leaderboard/rating2.png")';
                    SeasonRewardIcon.style.backgroundSize = "100%"
                    var SeasonRewardSeasonLabel = $.CreatePanel("Label", SeasonReward, "");
                    SeasonRewardSeasonLabel.AddClass("SeasonRewardSeasonLabel")
                    SeasonRewardSeasonLabel.text = data.rating_history[i]
                    SetTextInfoSeason(SeasonReward, $.Localize("#season") + " " + i + " : PvP")
                }
                else if (data.rating_history[i] > 50 && data.rating_history[i] < 101)
                {
                    var SeasonReward = $.CreatePanel("Panel", $("#OldSeasonRewards"), "");
                    SeasonReward.AddClass("SeasonReward");
                    var SeasonRewardIcon = $.CreatePanel("Panel", SeasonReward, "");
                    SeasonRewardIcon.AddClass("SeasonRewardIcon");
                    SeasonRewardIcon.style.backgroundImage = 'url("file://{images}/custom_game/leaderboard/rating3.png")';
                    SeasonRewardIcon.style.backgroundSize = "100%"
                    var SeasonRewardSeasonLabel = $.CreatePanel("Label", SeasonReward, "");
                    SeasonRewardSeasonLabel.AddClass("SeasonRewardSeasonLabel")
                    SeasonRewardSeasonLabel.text = data.rating_history[i]
                    SetTextInfoSeason(SeasonReward, $.Localize("#season") + " " + i + " : PvP")
                }
            }
        }
    }
}

function SwitchTabShop(tab, button) 
{
    if (current_tab_shop != tab)
    {
        Game.EmitSound("ui_topmenu_select")
    }
    current_tab_shop = tab
    $("#ShopPlusWindow").style.visibility = "collapse";
    $("#ShopPetsWindow").style.visibility = "collapse";
    $("#ShopFiveWindow").style.visibility = "collapse";
    //$("#ShopCurrencyWindow").style.visibility = "collapse";
    $("#ShopEmblemsWindow").style.visibility = "collapse";
    $("#ShopTipsWindow").style.visibility = "collapse";

    $("#ShopMenuButtonPlus").SetHasClass( "DonateNewMenuButtonSelected", false );
    $("#ShopMenuButtonPets").SetHasClass( "DonateNewMenuButtonSelected", false );
    //$("#ShopMenuButtonCurrency").SetHasClass( "DonateNewMenuButtonSelected", false );
    $("#ShopMenuButtonEmblems").SetHasClass( "DonateNewMenuButtonSelected", false );
    $("#ShopMenuButtonTips").SetHasClass( "DonateNewMenuButtonSelected", false );
    $("#ShopMenuButtonFive").SetHasClass( "DonateNewMenuButtonSelected", false );

    $("#" + button).SetHasClass( "DonateNewMenuButtonSelected", true );
    $("#" + tab).style.visibility = "visible";
}

function SwitchTabInventory(tab, button) 
{
    if (current_tab_inventory != tab)
    {
        Game.EmitSound("ui_topmenu_select")
    }
    current_tab_inventory = tab
    $("#PetsWindow").style.visibility = "collapse";
    $("#EmblemsWindow").style.visibility = "collapse";
    $("#TipsWindow").style.visibility = "collapse";

    $("#MenuPets").SetHasClass( "DonateNewMenuButtonSelected", false );
    $("#MenuEmblems").SetHasClass( "DonateNewMenuButtonSelected", false );
    $("#MenuTips").SetHasClass( "DonateNewMenuButtonSelected", false );

    $("#" + button).SetHasClass( "DonateNewMenuButtonSelected", true );
    $("#" + tab).style.visibility = "visible";
}

var HEROES_BUY_LIST = 
[
    //["npc_dota_hero_tidehunter", [20, 1, "wodacoin"], [70, 7, "wodacoin"], [150,30, "wodacoin"], [450,3650, "wodacoin"], [450, 3650, "wodacrystal"]],
    //["npc_dota_hero_nevermore", [20, 1, "wodacoin"], [70, 7, "wodacoin"], [150,30, "wodacoin"], [450,3650, "wodacoin"], [450, 3650, "wodacrystal"]],
    //["npc_dota_hero_skywrath_mage", [20, 1, "wodacoin"], [70, 7, "wodacoin"], [150,30, "wodacoin"], [450,3650, "wodacoin"], [450, 3650, "wodacrystal"]],
    //["npc_dota_hero_pudge", [20, 1, "wodacoin"], [70, 7, "wodacoin"], [150,30, "wodacoin"], [450,3650, "wodacoin"], [450, 3650, "wodacrystal"]],
    //["npc_dota_hero_furion", [20, 1, "wodacoin"], [70, 7, "wodacoin"], [150,30, "wodacoin"], [450,3650, "wodacoin"], [450, 3650, "wodacrystal"]],
    //["npc_dota_hero_phantom_assassin", [20, 1, "wodacoin"], [70, 7, "wodacoin"], [150,30, "wodacoin"], [450,3650, "wodacoin"], [450, 3650, "wodacrystal"]],
    //["npc_dota_hero_doom_bringer", [20, 1, "wodacoin"], [70, 7, "wodacoin"], [150,30, "wodacoin"], [450,3650, "wodacoin"], [450, 3650, "wodacrystal"]],
    //["npc_dota_hero_death_prophet", [20, 1, "wodacoin"], [70, 7, "wodacoin"], [150,30, "wodacoin"], [450,3650, "wodacoin"], [450, 3650, "wodacrystal"]],
    //["npc_dota_hero_invoker", [20, 1, "wodacoin"], [70, 7, "wodacoin"], [150,30, "wodacoin"], [450,3650, "wodacoin"], [450, 3650, "wodacrystal"]],
    //["npc_dota_hero_terrorblade", [20, 1, "wodacoin"], [70, 7, "wodacoin"], [150,30, "wodacoin"], [450,3650, "wodacoin"], [450, 3650, "wodacrystal"]],
    //["npc_dota_hero_vengefulspirit", [20, 1, "wodacoin"], [70, 7, "wodacoin"], [150,30, "wodacoin"], [450,3650, "wodacoin"], [450, 3650, "wodacrystal"]],
    //["npc_dota_hero_legion_commander", [20, 1, "wodacoin"], [70, 7, "wodacoin"], [150,30, "wodacoin"], [450,3650, "wodacoin"], [450, 3650, "wodacrystal"]],
    //["npc_dota_hero_lion", [20, 1, "wodacoin"], [70, 7, "wodacoin"], [150,30, "wodacoin"], [450,3650, "wodacoin"], [450, 3650, "wodacrystal"]],
    //["npc_dota_hero_kunkka", [20, 1, "wodacoin"], [70, 7, "wodacoin"], [150,30, "wodacoin"], [450,3650, "wodacoin"], [450, 3650, "wodacrystal"]],
    //["npc_dota_hero_slardar", [20, 1, "wodacoin"], [70, 7, "wodacoin"], [150,30, "wodacoin"], [450,3650, "wodacoin"], [450, 3650, "wodacrystal"]],
    //["npc_dota_hero_morphling", [20, 1, "wodacoin"], [70, 7, "wodacoin"], [150,30, "wodacoin"], [450,3650, "wodacoin"], [450, 3650, "wodacrystal"]],
    //["npc_dota_hero_slark", [20, 1, "wodacoin"], [70, 7, "wodacoin"], [150,30, "wodacoin"], [450,3650, "wodacoin"], [450, 3650, "wodacrystal"]],
    //["npc_dota_hero_disruptor", [20, 1, "wodacoin"], [70, 7, "wodacoin"], [150,30, "wodacoin"], [450,3650, "wodacoin"], [450, 3650, "wodacrystal"]],
    //["npc_dota_hero_juggernaut", [20, 1, "wodacoin"], [70, 7, "wodacoin"], [150,30, "wodacoin"], [450,3650, "wodacoin"], [450, 3650, "wodacrystal"]],
    //["npc_dota_hero_spectre", [20, 1, "wodacoin"], [70, 7, "wodacoin"], [150,30, "wodacoin"], [450,3650, "wodacoin"], [450, 3650, "wodacrystal"]],
    //["npc_dota_hero_bristleback", [20, 1, "wodacoin"], [70, 7, "wodacoin"], [150, 30, "wodacoin"], [450, 3650, "wodacoin"], [450, 3650, "wodacrystal"]],
]
  
var Items_currency = [
    // ID ПРЕДМЕТА для проверки или для добавления в базу,ВАЛЮТА,СТОИМОСТЬ,ИКОНКА(именно название png файла),переменная названия в локализации, можно покупать много раз или один раз(проверка на покупку в базе)
    ["0", "", "#currency_1", "big_coin", "donate_change_crystals_1", true], 
]

var Items_plus = 
[
    // ID ПРЕДМЕТА для проверки или для добавления в базу,ВАЛЮТА,СТОИМОСТЬ,ИКОНКА(именно название png файла),переменная названия в локализации, можно покупать много раз или один раз(проверка на покупку в базе)
    ["99991", "coin", "1", "new", "subscribe_plus_new", true],
    ["subscribe_plus_1", "coin", "650", "dp1", "subscribe_plus_1", false],
    ["9994", "coin", "500", "nydp1", "nydp1", true],
    ["9995", "coin", "500", "nydp2", "nydp2", true],
    ["9996", "coin", "500", "nydp3", "nydp3", true],
    ["9997", "coin", "500", "nydp4", "nydp4", true],
] 

// Последний юзабельный айди 716

var Items_Five =
[
    ["707", "coin", "500", "five_1", "five_1", true, 0],
    ["708", "coin", "500", "five_2", "five_2", true, 0],
    ["709", "coin", "500", "five_3", "five_3", true, 0],
    ["710", "coin", "500", "five_4", "five_4", true, 0],
    ["711", "coin", "500", "five_5", "five_5", true, 0],
    ["712", "coin", "500", "five_6", "five_6", true, 0],
    ["713", "coin", "500", "five_7", "five_7", true, 0],
    ["714", "coin", "500", "five_8", "five_8", true, 0],
    ["715", "coin", "500", "five_9", "five_9", true, 0],
    ["716", "coin", "500", "five_10", "five_10", true, 0],
]

var Items_pets = 
[
    // ID ПРЕДМЕТА для проверки или для добавления в базу,ВАЛЮТА,СТОИМОСТЬ,ИКОНКА(именно название png файла),переменная названия в локализации, можно покупать много раз или один раз(проверка на покупку в базе)

    // 150
    ["701", "coin", "150", "0", "pet_124", true, 0],
    ["702", "coin", "150", "0", "pet_125", true, 0],
    ["1", "coin", "150", "10012", "pet_1", true, 0],
    ["2", "coin", "150", "10026", "pet_2", true, 0],
    ["3", "coin", "150", "10028", "pet_3", true, 0],
    ["4", "coin", "150", "10027", "pet_4", true, 0],
    ["5", "coin", "150", "10025", "pet_5", true, 0],
    ["7", "coin", "150", "10017", "pet_7", true, 0],
    ["8", "coin", "150", "10024", "pet_8", true, 0],
    ["9", "coin", "150", "10011", "pet_9", true, 0],
    ["10", "coin", "150", "10281", "pet_10", true, 0],
    ["11", "coin", "150", "10318", "pet_11", true, 0],
    ["12", "coin", "150", "10920", "pet_12", true, 0],
    ["13", "coin", "150", "10524", "pet_13", true, 0],
    ["14", "coin", "150", "10386", "pet_14", true, 0],
    ["15", "coin", "150", "10167", "pet_15", true, 0],
    ["16", "coin", "150", "10375", "pet_16", true, 0],
    ["17", "coin", "150", "11383", "pet_17", true, 0],
    ["18", "coin", "150", "17664", "pet_18", true, 0],
    ["20", "coin", "150", "10833", "pet_20", true, 0],
    ["22", "coin", "150", "10194", "pet_22", true, 0],
    ["23", "coin", "150", "12866", "pet_23", true, 0],
    ["24", "coin", "150", "10170", "pet_24", true, 0],
    ["26", "coin", "150", "10163", "pet_26", true, 0],
    ["28", "coin", "150", "14218", "pet_28", true, 0],
    ["29", "coin", "150", "10195", "pet_29", true, 0],
    ["30", "coin", "150", "10193", "pet_30", true, 0],
    ["31", "coin", "150", "10703", "pet_31", true, 0],
    ["32", "coin", "150", "10703", "pet_32", true, 0],
    ["33", "coin", "150", "10896", "pet_33", true, 0],
    ["34", "coin", "150", "10758", "pet_34", true, 0],
    ["35", "coin", "150", "10172", "pet_35", true, 0],
    ["37", "coin", "150", "10171", "pet_37", true, 0],
    ["38", "coin", "150", "23519", "pet_38", true, 0],
    ["40", "coin", "150", "18408", "pet_40", true, 0],
    ["41", "coin", "150", "10834", "pet_41", true, 0],
    ["42", "coin", "150", "10147", "pet_42", true, 0],
    ["43", "coin", "150", "10041", "pet_43", true, 0],
    ["44", "coin", "150", "10918", "pet_44", true, 0],
    ["45", "coin", "150", "10158", "pet_45", true, 0],
    ["48", "coin", "150", "10350", "pet_48", true, 0],
    ["49", "coin", "150", "10433", "pet_49", true, 0],
    ["50", "coin", "150", "17257", "pet_50", true, 0],
    ["51", "coin", "150", "10750", "pet_51", true, 0],
    ["52", "coin", "150", "11143", "pet_52", true, 0],
    ["54", "coin", "150", "10192", "pet_54", true, 0],
    ["55", "coin", "150", "11368", "pet_55", true, 0],
    ["56", "coin", "150", "11130", "pet_56", true, 0],
    ["57", "coin", "150", "10664", "pet_57", true, 0],
    ["58", "coin", "150", "10169", "pet_58", true, 0],
    ["59", "coin", "150", "10663", "pet_59", true, 0],
    ["60", "coin", "150", "10164", "pet_60", true, 0],
    ["62", "coin", "150", "10295", "pet_62", true, 0],
    ["63", "coin", "150", "10376", "pet_63", true, 0],
    ["64", "coin", "150", "10395", "pet_64", true, 0],
    ["65", "coin", "150", "10395", "pet_65", true, 0],
    ["68", "coin", "150", "11899", "pet_68", true, 0],
    ["69", "coin", "150", "10298", "pet_69", true, 0],
    ["70", "coin", "150", "10323", "pet_70", true, 0],
    ["71", "coin", "150", "11438", "pet_71", true, 0],
    ["72", "coin", "150", "11278", "pet_72", true, 0],
    ["73", "coin", "150", "10938", "pet_73", true, 0],
    ["74", "coin", "150", "11425", "pet_74", true, 0],
    ["75", "coin", "150", "10845", "pet_75", true, 0],
    ["76", "coin", "150", "14032", "pet_76", true, 0],
    ["77", "coin", "150", "10456", "pet_77", true, 0],
   
    //1500
    ["78", "coin", "1500", "11521", "pet_78", true, 0],
    ["79", "coin", "1500", "11735", "pet_79", true, 0],
    ["80", "coin", "1500", "11091", "pet_80", true, 0],
    ["81", "coin", "1500", "11760", "pet_81", true, 0],
    ["82", "coin", "1500", "11866", "pet_82", true, 0],
    ["83", "coin", "1500", "10670", "pet_83", true, 0],
    ["85", "coin", "1500", "17774", "pet_85", true, 0],
    ["86", "coin", "1500", "10919", "pet_86", true, 0],
    ["87", "coin", "1500", "10872", "pet_87", true, 0],
    ["88", "coin", "1500", "19004", "pet_88", true, 1],
    ["89", "coin", "1500", "19004", "pet_89", true, 2],
    ["90", "coin", "1500", "19004", "pet_90", true, 3],
    ["91", "coin", "1500", "19004", "pet_91", true, 4],
    ["92", "coin", "1500", "19004", "pet_92", true, 5],
    ["93", "coin", "1500", "19328", "pet_93", true, 1],
    ["94", "coin", "1500", "19328", "pet_94", true, 2],
    ["95", "coin", "1500", "19328", "pet_95", true, 3],
    ["96", "coin", "1500", "19328", "pet_96", true, 4],
    ["97", "coin", "1500", "19328", "pet_97", true, 5],
    ["98", "coin", "1500", "13775", "pet_98", true, 1],
    ["99", "coin", "1500", "13775", "pet_99", true, 2],
    ["100", "coin", "1500", "13775", "pet_100", true, 3],
    ["101", "coin", "1500", "13775", "pet_101", true, 4],
    ["102", "coin", "1500", "13775", "pet_102", true, 5],
    ["103", "coin", "1500", "10091", "pet_103", true, 0],
    ["104", "coin", "1500", "10374", "pet_104", true, 0],
    ["105", "coin", "1500", "12007", "pet_105", true, 0],
    ["106", "coin", "1500", "12202", "pet_106", true, 0],
    ["107", "coin", "1500", "10478", "pet_107", true, 0],
    ["108", "coin", "1500", "10479", "pet_108", true, 0],
    ["109", "coin", "1500", "12994", "pet_109", true, 0],
    ["112", "coin", "1500", "12320", "pet_112", true, 0],
 
    // 15000
    ["113", "coin", "5000", "11522", "pet_113", true, 0],
    ["114", "coin", "5000", "11740", "pet_114", true, 0],
    ["115", "coin", "5000", "11092", "pet_115", true, 0],
    ["116", "coin", "5000", "11764", "pet_116", true, 0],
    ["117", "coin", "5000", "11865", "pet_117", true, 0],
    ["118", "coin", "5000", "10702", "pet_118", true, 0],
    ["119", "coin", "5000", "10143", "pet_119", true, 0],
    ["120", "coin", "5000", "19004", "pet_120", true, 6],
    ["121", "coin", "5000", "19328", "pet_121", true, 6],
    ["122", "coin", "5000", "13775", "pet_122", true, 6],
    ["123", "coin", "5000", "10096", "pet_123", true, 0],
] 

var Items_emblems = 
[
    // ID ПРЕДМЕТА для проверки или для добавления в базу,ВАЛЮТА,СТОИМОСТЬ,ИКОНКА(именно название png файла),переменная названия в локализации, можно покупать много раз или один раз(проверка на покупку в базе)
    ["205", "coin", "500", "emblem_41", "emblem_41", true],
    ["200", "coin", "500", "emblem_37", "emblem_37", true],
    ["178", "coin", "500", "emblem_15", "emblem_15", true],
    ["179", "coin", "500", "emblem_16", "emblem_16", true],
    ["182", "coin", "500", "emblem_19", "emblem_19", true],
    ["181", "coin", "500", "emblem_18", "emblem_18", true],
    ["196", "coin", "500", "emblem_33", "emblem_33", true],
    ["198", "coin", "500", "emblem_35", "emblem_35", true],
    ["199", "coin", "500", "emblem_36", "emblem_36", true],
    ["195", "coin", "1500", "emblem_32", "emblem_32", true],
    ["201", "coin", "1500", "emblem_38", "emblem_38", true],
    ["126", "coin", "1500", "emblem_3", "emblem_3", true],
    ["125", "coin", "1500", "emblem_2", "emblem_2", true],
    ["127", "coin", "1500", "emblem_4", "emblem_4", true],
    ["124", "coin", "1500", "emblem_1", "emblem_1", true],
    ["129", "coin", "1500", "emblem_6", "emblem_6", true],
    ["130", "coin", "1500", "emblem_7", "emblem_7", true],
    ["128", "coin", "1500", "emblem_5", "emblem_5", true],
    ["131", "coin", "1500", "emblem_8", "emblem_8", true],
    ["176", "coin", "1500", "emblem_13", "emblem_13", true],
    ["133", "coin", "1500", "emblem_10", "emblem_10", true],
    ["134", "coin", "1500", "emblem_11", "emblem_11", true],
    ["132", "coin", "1500", "emblem_9", "emblem_9", true],
    ["175", "coin", "1500", "emblem_12", "emblem_12", true], 
    ["177", "coin", "1500", "emblem_14", "emblem_14", true],  
    ["180", "coin", "1500", "emblem_17", "emblem_17", true],
    ["183", "coin", "1500", "emblem_20", "emblem_20", true],
    ["184", "coin", "1500", "emblem_21", "emblem_21", true],
    ["185", "coin", "1500", "emblem_22", "emblem_22", true],
    ["186", "coin", "1500", "emblem_23", "emblem_23", true],
    ["187", "coin", "1500", "emblem_24", "emblem_24", true],  
    ["189", "coin", "1500", "emblem_26", "emblem_26", true],
    ["190", "coin", "1500", "emblem_27", "emblem_27", true],
    ["191", "coin", "1500", "emblem_28", "emblem_28", true],
    ["192", "coin", "1500", "emblem_29", "emblem_29", true],
    ["188", "coin", "1500", "emblem_25", "emblem_25", true],
    ["203", "coin", "1500", "emblem_39", "emblem_39", true],
    ["197", "coin", "1500", "emblem_34", "emblem_34", true],
    ["208", "coin", "1500", "emblem_46", "emblem_46", true],
	["209", "coin", "1500", "emblem_47", "emblem_47", true],
    ["700", "coin", "1500", "emblem_48", "emblem_48", true],
    ["207", "coin", "1500", "emblem_45", "emblem_45", true],
    ["705", "coin", "1500", "emblem_49", "emblem_49", true],

    ["193", "coin", "5000", "emblem_30", "emblem_30", true],
    ["204", "coin", "5000", "emblem_40", "emblem_40", true],
    ["194", "coin", "5000", "emblem_31", "emblem_31", true],
    ["433", "coin", "5000", "emblem_42", "emblem_42", true],
    ["434", "coin", "5000", "emblem_43", "emblem_43", true],
    ["206", "coin", "5000", "emblem_44", "emblem_44", true],
    ["706", "coin", "5000", "emblem_50", "emblem_50", true],
] 

var Items_tips = 
[
    // ID ПРЕДМЕТА для проверки или для добавления в базу,ВАЛЮТА,СТОИМОСТЬ,ИКОНКА(именно название png файла),переменная названия в локализации, можно покупать много раз или один раз(проверка на покупку в базе)
    ["435", "coin", "0", "tip", "tipped_435", true],
    ["436", "coin", "0", "tip", "tipped_436", true],
    ["437", "coin", "0", "tip", "tipped_437", true],
    ["438", "coin", "0", "tip", "tipped_438", true],
    ["439", "coin", "0", "tip", "tipped_439", true],
    ["440", "coin", "0", "tip", "tipped_440", true],

    ["441", "coin", "150", "tip", "tipped_441", true],
    ["442", "coin", "150", "tip", "tipped_442", true],
    ["443", "coin", "150", "tip", "tipped_443", true],
    ["444", "coin", "150", "tip", "tipped_444", true],
    ["445", "coin", "150", "tip", "tipped_445", true],
    ["446", "coin", "150", "tip", "tipped_446", true],
    ["447", "coin", "150", "tip", "tipped_447", true],
    ["448", "coin", "150", "tip", "tipped_448", true],
    ["449", "coin", "150", "tip", "tipped_449", true],
    ["450", "coin", "150", "tip", "tipped_450", true],

    ["451", "coin", "150", "tip", "tipped_451", true],
    ["452", "coin", "150", "tip", "tipped_452", true],
    ["453", "coin", "150", "tip", "tipped_453", true],
    ["454", "coin", "150", "tip", "tipped_454", true],
    ["455", "coin", "150", "tip", "tipped_455", true],
    ["456", "coin", "150", "tip", "tipped_456", true],
    ["457", "coin", "150", "tip", "tipped_457", true],
    ["458", "coin", "150", "tip", "tipped_458", true],
    ["459", "coin", "150", "tip", "tipped_459", true],
    ["460", "coin", "150", "tip", "tipped_460", true],
    ["461", "coin", "150", "tip", "tipped_461", true],
    ["462", "coin", "150", "tip", "tipped_462", true],

    ["475", "coin", "150", "tip", "tipped_475", true],
    ["476", "coin", "150", "tip", "tipped_476", true],
    ["477", "coin", "150", "tip", "tipped_477", true],
    ["478", "coin", "150", "tip", "tipped_478", true],
    ["479", "coin", "150", "tip", "tipped_479", true],
    ["480", "coin", "150", "tip", "tipped_480", true],
    ["481", "coin", "150", "tip", "tipped_481", true],
    ["482", "coin", "150", "tip", "tipped_482", true],

    ["463", "coin", "150", "tip", "tipped_463", true],
    ["464", "coin", "150", "tip", "tipped_464", true],
    ["465", "coin", "150", "tip", "tipped_465", true],
    ["466", "coin", "150", "tip", "tipped_466", true],
    ["467", "coin", "150", "tip", "tipped_467", true],
    ["468", "coin", "150", "tip", "tipped_468", true],
    ["469", "coin", "150", "tip", "tipped_469", true],
    ["470", "coin", "150", "tip", "tipped_470", true],
    ["471", "coin", "150", "tip", "tipped_471", true],
    ["472", "coin", "150", "tip", "tipped_472", true],
    ["473", "coin", "150", "tip", "tipped_473", true],
    ["474", "coin", "150", "tip", "tipped_474", true],

    ["405", "coin", "150", "tip", "tipped_405", true],
    ["406", "coin", "150", "tip", "tipped_406", true],
    ["407", "coin", "150", "tip", "tipped_407", true],
    ["408", "coin", "150", "tip", "tipped_408", true],
    ["409", "coin", "150", "tip", "tipped_409", true],
    ["410", "coin", "150", "tip", "tipped_410", true],
    ["411", "coin", "150", "tip", "tipped_411", true],
    ["412", "coin", "150", "tip", "tipped_412", true],
    ["413", "coin", "150", "tip", "tipped_413", true],
    ["414", "coin", "150", "tip", "tipped_414", true],
    ["415", "coin", "150", "tip", "tipped_415", true],
    ["416", "coin", "150", "tip", "tipped_416", true],  
    ["417", "coin", "150", "tip", "tipped_417", true],
    ["418", "coin", "150", "tip", "tipped_418", true],
    ["419", "coin", "150", "tip", "tipped_419", true],
    ["420", "coin", "150", "tip", "tipped_420", true],
    ["421", "coin", "150", "tip", "tipped_421", true],
    ["422", "coin", "150", "tip", "tipped_422", true],
    ["423", "coin", "150", "tip", "tipped_423", true],
    ["424", "coin", "150", "tip", "tipped_424", true],
    ["425", "coin", "150", "tip", "tipped_425", true],
    ["426", "coin", "150", "tip", "tipped_426", true],
    ["427", "coin", "150", "tip", "tipped_427", true],
    ["428", "coin", "150", "tip", "tipped_428", true],
    ["429", "coin", "150", "tip", "tipped_429", true],
    ["430", "coin", "150", "tip", "tipped_430", true],
    ["431", "coin", "150", "tip", "tipped_431", true],
    ["432", "coin", "150", "tip", "tipped_432", true],

    ["703", "coin", "150", "tip", "tipped_703", true],
    ["704", "coin", "150", "tip", "tipped_704", true],
] 

function InitItems() {
    $('#ShopPlusWindow').RemoveAndDeleteChildren()
    //$('#ShopCurrencyWindow').RemoveAndDeleteChildren()
    $('#ShopPetsWindow').RemoveAndDeleteChildren()
    $('#ShopFiveWindow').RemoveAndDeleteChildren()
    $('#ShopEmblemsWindow').RemoveAndDeleteChildren()
    $('#ShopTipsWindow').RemoveAndDeleteChildren()

    for (var i = 0; i < Items_plus.length; i++) 
    {
        CreateItemInShop($('#ShopPlusWindow'), Items_plus, i)
    }

    //for (var i = 0; i < Items_currency.length; i++) 
    //{
    //    CreateItemInShop($('#ShopCurrencyWindow'), Items_currency, i)
    //}

    for (var i = 0; i < Items_pets.length; i++) 
    {
        CreateItemInShop($('#ShopPetsWindow'), Items_pets, i)
    }

    for (var i = 0; i < Items_Five.length; i++) 
    {
        CreateItemInShop($('#ShopFiveWindow'), Items_Five, i)
    }

    for (var i = 0; i < Items_emblems.length; i++) 
    {
        CreateItemInShop($('#ShopEmblemsWindow'), Items_emblems, i)
    }

    for (var i = 0; i < Items_tips.length; i++) 
    {
        CreateItemInShop($('#ShopTipsWindow'), Items_tips, i)
    }
}

function CreateItemInShop(panel, table, i) 
{
    var Recom_item = $.CreatePanel("Panel", panel, "");
    Recom_item.AddClass("ItemShop");

    if (table[i][4].indexOf("pet_") !== 0) 
    {
        var ItemImage = $.CreatePanel("Panel", Recom_item, "");
        ItemImage.AddClass("ItemImage");
        ItemImage.style.backgroundImage = 'url("file://{images}/custom_game/shop/' + table[i][3] + '.png")';
        ItemImage.style.backgroundSize = "100%"
    }
    else
    {
        var ItemImage = $.CreatePanel("Panel", Recom_item, "");
        ItemImage.AddClass("ItemImage");
        ItemImage.style.backgroundImage = 'url("file://{images}/custom_game/shop/' + table[i][0] + '.png")';
        ItemImage.style.backgroundSize = "100%"
    }

    var ItemName = $.CreatePanel("Label", Recom_item, "ItemName");
    ItemName.AddClass("ItemName");
    ItemName.text = $.Localize( "#" + table[i][4] )

    var BuyItemPanel = $.CreatePanel("Panel", Recom_item, "BuyItemPanel");
    BuyItemPanel.AddClass("BuyItemPanel");

    if (table[i][0] == "0")
    {
        SetItemRedirectShop(Recom_item)
    } 
    else 
    {
        SetItemBuyFunction(Recom_item, table[i])
    }

    var ItemPrice = $.CreatePanel("Panel", BuyItemPanel, "ItemPrice");
    ItemPrice.AddClass("ItemPrice");

    if (table[i][1] != "")
    {
        var PriceIcon = $.CreatePanel("Panel", ItemPrice, "PriceIcon");
        PriceIcon.AddClass("PriceIcon" + table[i][1]);
    }

    var PriceLabel = $.CreatePanel("Label", ItemPrice, "PriceLabel");
    PriceLabel.AddClass("PriceLabel");
    PriceLabel.text = $.Localize(table[i][2])


    var player_table = CustomNetTables.GetTableValue("woda_player_data", String(Players.GetLocalPlayer()))
    var player_table_js = []

    for (var d = 1; d < 300; d++) 
    {
        if (player_table.donate_items[d])
        {
            player_table_js.push(player_table.donate_items[d])
        }
    }

    for ( var item of player_table_js )
    {
        if (item == table[i][0]) 
        {
            Recom_item.SetPanelEvent("onactivate", function() {} );
            BuyItemPanel.style.saturation = "0"
            PriceLabel.text = $.Localize( "#shop_bought" )
            if (PriceIcon)
            {
                PriceIcon.DeleteAsync( 0 );
            }
        }
    }
}

function SetItemBuyFunction(panel, item_info)
{
    panel.SetPanelEvent("onactivate", function() 
    {
        $("#BuyItemPanelInfo").RemoveAndDeleteChildren()
        $("#BuyItemPanelName").text = $.Localize( "#" + item_info[4] )

        if (item_info[4].indexOf("pet_") !== 0) 
        {
            var ItemImage = $.CreatePanel("Panel", $("#BuyItemPanelInfo"), "");
            ItemImage.AddClass("ItemImageBuy");
            ItemImage.style.backgroundImage = 'url("file://{images}/custom_game/shop/' + item_info[3] + '_open.png")';
            ItemImage.style.backgroundSize = "100%"
        }
        else
        {
            var ItemImage = $.CreatePanel("Panel", $("#BuyItemPanelInfo"), "");
            ItemImage.AddClass("ItemImageBuy");
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
    var player_table = CustomNetTables.GetTableValue("woda_player_data", String(Players.GetLocalPlayer()))

    if (player_table)
    {
        if ((typeof player_table.crystals !== 'undefined') && (typeof player_table.coins !== 'undefined')) 
        {
            if (item_info[1] == "crystal") {
                GameEvents.SendCustomGameEventToServer_custom( "donate_shop_buy_item", {item_id : item_info[0], price : item_info[2], currency : item_info[1], } );
                LoadingCreated()
            } else if (item_info[1] == "coin") {
                GameEvents.SendCustomGameEventToServer_custom( "donate_shop_buy_item", {item_id : item_info[0], price : item_info[2], currency : item_info[1], } );
                LoadingCreated()
            }
        }
    }

    $.Schedule( 0.25, function(){
        InitData()
        InitHeroes()
        InitItems()
        InitInventory() 
    })
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

    let donate_heroes = false
    let heroes_buying = false

    for (var i = 0; i < Object.keys(HEROES_BUY_LIST).length; i++) 
    {
        if (HEROES_BUY_LIST[i][0] == hero_name)
        {
           donate_heroes = true 
        } 
    }

    ShowHero(HeroBuy, hero_name, donate_heroes) 

    if (donate_heroes && !HeroBougth(hero_name))
    {
        var HeroBuyButton = $.CreatePanel("Panel", HeroBuy, "");
        HeroBuyButton.AddClass("HeroBuyButton");
        var BuyHeroLabel = $.CreatePanel("Label", HeroBuyButton, "");
        BuyHeroLabel.AddClass("BuyHeroLabel");
        BuyHeroLabel.text = $.Localize("#button_buy")
        HeroBuyButton.style.zIndex = 10
        HeroImage.style.saturation = 0
        CreateEventBuyHeroes(HeroBuy, hero_name)
    }
    if (HeroBougth(hero_name))
    {
        //var HeroDaysCount = $.CreatePanel("Label", HeroBuy, "");
        //HeroDaysCount.AddClass("HeroDaysCount");
        //HeroDaysCount.text = GetHeroDaysCount(hero_name)
        //if (GetHeroDaysCount(hero_name) == "")
        //{
        //    HeroDaysCount.style.opacity = "0"
        //}
    } 
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
        } else {
            rank_info_label.text = hero_progress + " / " + hero_progress_max
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
    let woda_player_data = CustomNetTables.GetTableValue("woda_player_data", String(Players.GetLocalPlayer()) )
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


function HeroBougth(heroname)
{
    if (true)
    {
        return true
    }
    let player_data = CustomNetTables.GetTableValue("woda_player_data", String(Players.GetLocalPlayer()))

    if (player_data)
    {
        if (player_data.donate_heroes) 
        {
            for (var i = 1; i <= Object.keys(player_data.donate_heroes).length; i++) 
            {
                if (player_data.donate_heroes[i] && player_data.donate_heroes[i].hero_name == heroname && player_data.donate_heroes[i].days > 0 )
                {
                    return true
                }
            }
            return false
        }
        return false
    }
    return false
}

function GetHeroDaysCount(heroname)
{
    let player_data = CustomNetTables.GetTableValue("woda_player_data", String(Players.GetLocalPlayer()))
    
    if (player_data)
    {
        if (player_data.donate_heroes) 
        {
            for (var i = 1; i <= Object.keys(player_data.donate_heroes).length; i++) 
            {
                if (player_data.donate_heroes[i] && player_data.donate_heroes[i].hero_name == heroname && player_data.donate_heroes[i].days > 0 )
                {
                    if (player_data.donate_heroes[i].days > 365)
                    {
                        return ""
                    }
                    return String(player_data.donate_heroes[i].days) + " " + $.Localize("#days")
                }
            }
            return "0"
        }
        return "0"
    }
    return  "0"
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

        if (buy && !HeroBougth(hero)) 
        {
            vid.style.saturation = 0
        }
    });

    panel.SetPanelEvent('onmouseout', function() {
        var movie = panel.FindChild('portrait_' + hero + '')
        if (movie) {
            movie.DeleteAsync(0)
        }
        let rank_info = panel.FindChildTraverse("rank_info")
        if (rank_info) {
            rank_info.style.opacity = "0"
        }
    })
}

GameUI.CustomUIConfig().OpenHeroBuyCustomPick = function OpenHeroBuy(heroname) {
    $("#HeroBuyInfo").RemoveAndDeleteChildren()

    $("#HeroNameBuy").text = $.Localize("#" + heroname)

    $.CreatePanel("MoviePanel", $("#HeroBuyInfo"), 'portrait_' + heroname, { class: "hero_portrait_buying", src: "file://{resources}/videos/heroes/" + heroname + ".webm", repeat: "true", hittest: "false", autoplay: "onload" });

    var HeroBuyingPriceButtons = $.CreatePanel("Panel", $("#HeroBuyInfo"), "");
    HeroBuyingPriceButtons.AddClass("HeroBuyingPriceButtons");

    let hero_info = null

    for (var i = 0; i < Object.keys(HEROES_BUY_LIST).length; i++) {
        if (HEROES_BUY_LIST[i][0] == heroname) {
            hero_info = HEROES_BUY_LIST[i]
        }
    }

    if (hero_info != null) {
        for (var i = 1; i < Object.keys(hero_info).length; i++) {
            var button_buy_hero = $.CreatePanel("Panel", HeroBuyingPriceButtons, "");
            button_buy_hero.AddClass("button_buy_hero");

            var button_buy_hero_info_center = $.CreatePanel("Panel", button_buy_hero, "");
            button_buy_hero_info_center.AddClass("button_buy_hero_info_center");


            var button_buy_hero_label = $.CreatePanel("Label", button_buy_hero_info_center, "");
            button_buy_hero_label.AddClass("button_buy_hero_label");
            button_buy_hero_label.text = String(hero_info[i][0])

            var valuteicon = $.CreatePanel("Panel", button_buy_hero_info_center, "");
            valuteicon.AddClass("valuteicon");
            valuteicon.style.backgroundImage = 'url("file://{images}/custom_game/shop/' + hero_info[i][2] + '.png")';
            valuteicon.style.backgroundSize = "100%"

            var button_buy_hero_label2 = $.CreatePanel("Label", button_buy_hero_info_center, "");
            button_buy_hero_label2.AddClass("button_buy_hero_label");


            if (hero_info[i][1] > 365) {
                button_buy_hero_label2.text = " / " + $.Localize("#hero_days_365")
            } else {
                button_buy_hero_label2.text = " / " + String(hero_info[i][1]) + " " + $.Localize("#days")
            }

            SetHeroBuyFunctional(button_buy_hero, heroname, hero_info[i])
        }
        $("#BuyHeroPanel").style.visibility = "visible"
    }
}

function SetHeroBuyFunctional(panel, heroname, info)
{
    panel.SetPanelEvent("onactivate", function() { BuyHeroToServer(heroname, info); CloseBuyHeroPanel(); } );
}

function BuyHeroToServer(heroname, info)
{
    var player_table = CustomNetTables.GetTableValue("woda_player_data", String(Players.GetLocalPlayer()))

    if (player_table)
    {
        if ((typeof player_table.crystals !== 'undefined') && (typeof player_table.coins !== 'undefined')) 
        {
            GameEvents.SendCustomGameEventToServer_custom( "donate_shop_buy_hero", {hero_name : heroname, price : info[0], currency : info[2], days : info[1],  } );
            LoadingCreated()
        }
    }

    $.Schedule( 0.25, function()
    {
        InitData()
        InitHeroes()
        InitItems()
        InitInventory() 
        GameUI.CustomUIConfig().UpdateBuyHeroes()
    })
}

// Выбор пета

function InitInventory() 
{
    $('#ItemsWindow').RemoveAndDeleteChildren()

    for (var i = 0; i < Items_pets.length; i++) 
    {
        CreateItemInInventory($('#ItemsWindow'), Items_pets, i)
    }

    for (var i = 0; i < Items_Five.length; i++) 
    {
        CreateItemInInventoryFive($('#ItemsWindow'), Items_Five, i)
    }

    for (var i = 0; i < Items_emblems.length; i++) 
    {
        CreateItemInInventoryEmblems($('#ItemsWindow'), Items_emblems, i)
    }

    for (var i = 0; i < Items_tips.length; i++) 
    {
        CreateItemInInventoryTips($('#ItemsWindow'), Items_tips, i)
    }
}

var courier_selected = null;

function SelectCourier(num)
{
    if (courier_selected != num)
    {
        for (var i = 0; i < $("#ItemsWindow").GetChildCount(); i++) 
        {
            if ($("#ItemsWindow").GetChild(i).is_courier != null)
            {
                $("#ItemsWindow").GetChild(i).FindChildTraverse("BuyItemPanel").style.backgroundColor = "gradient( linear, 0% 0%, 0% 100%, from( #60842c ), to( #40601d ))"
                $("#ItemsWindow").GetChild(i).FindChildTraverse("PriceLabel").text = $.Localize( "#shop_activate" )
            }
        } 
        $("#item_inventory_"+num).FindChildTraverse("BuyItemPanel").style.backgroundColor = "gradient( linear, 0% 0%, 0% 100%, from( #84302C ), to( #60321D ))"
        $("#item_inventory_"+num).FindChildTraverse("PriceLabel").text = $.Localize( "#shop_deactivate" )
        GameEvents.SendCustomGameEventToServer_custom( "change_premium_pet", {pet_id: num, delete_pet:false, } );
        courier_selected = num;
    }
    else
    {
        $("#item_inventory_"+courier_selected).FindChildTraverse("BuyItemPanel").style.backgroundColor = "gradient( linear, 0% 0%, 0% 100%, from( #60842c ), to( #40601d ))"
        $("#item_inventory_"+courier_selected).FindChildTraverse("PriceLabel").text = $.Localize( "#shop_activate" )
        GameEvents.SendCustomGameEventToServer_custom( "change_premium_pet", {pet_id: num, delete_pet: true, } );
        courier_selected = null;
    }
}

var emblem_selected = null;

function SelectEmblem(num)
{
    if (emblem_selected != num)
    {
        for (var i = 0; i < $("#ItemsWindow").GetChildCount(); i++) 
        {
            if ($("#ItemsWindow").GetChild(i).is_emblem != null)
            {
                $("#ItemsWindow").GetChild(i).FindChildTraverse("BuyItemPanel").style.backgroundColor = "gradient( linear, 0% 0%, 0% 100%, from( #60842c ), to( #40601d ))"
                $("#ItemsWindow").GetChild(i).FindChildTraverse("PriceLabel").text = $.Localize( "#shop_activate" )
            }
        } 
        $("#item_inventory_"+num).FindChildTraverse("BuyItemPanel").style.backgroundColor = "gradient( linear, 0% 0%, 0% 100%, from( #84302C ), to( #60321D ))"
        $("#item_inventory_"+num).FindChildTraverse("PriceLabel").text = $.Localize( "#shop_deactivate" )
        GameEvents.SendCustomGameEventToServer_custom( "change_premium_emblem", {effect: num, delete_effect:false, } );
        emblem_selected = num;
    }
    else
    {
        $("#item_inventory_"+emblem_selected).FindChildTraverse("BuyItemPanel").style.backgroundColor = "gradient( linear, 0% 0%, 0% 100%, from( #60842c ), to( #40601d ))"
        $("#item_inventory_"+emblem_selected).FindChildTraverse("PriceLabel").text = $.Localize( "#shop_activate" )
        GameEvents.SendCustomGameEventToServer_custom( "change_premium_emblem", {effect: num, delete_effect: true, } );
        emblem_selected = null;
    }
}

var five_selected = null;

function SelectFive(num)
{
    if (five_selected != num)
    {
        for (var i = 0; i < $("#ItemsWindow").GetChildCount(); i++) 
        {
            if ($("#ItemsWindow").GetChild(i).is_five != null)
            {
                $("#ItemsWindow").GetChild(i).FindChildTraverse("BuyItemPanel").style.backgroundColor = "gradient( linear, 0% 0%, 0% 100%, from( #60842c ), to( #40601d ))"
                $("#ItemsWindow").GetChild(i).FindChildTraverse("PriceLabel").text = $.Localize( "#shop_activate" )
            }
        } 
        $("#item_inventory_"+num).FindChildTraverse("BuyItemPanel").style.backgroundColor = "gradient( linear, 0% 0%, 0% 100%, from( #84302C ), to( #60321D ))"
        $("#item_inventory_"+num).FindChildTraverse("PriceLabel").text = $.Localize( "#shop_deactivate" )
        GameEvents.SendCustomGameEventToServer_custom( "change_premium_five", {five_id: num, delete_effect:false} );
        five_selected = num;
    }
    else
    {
        $("#item_inventory_"+five_selected).FindChildTraverse("BuyItemPanel").style.backgroundColor = "gradient( linear, 0% 0%, 0% 100%, from( #60842c ), to( #40601d ))"
        $("#item_inventory_"+five_selected).FindChildTraverse("PriceLabel").text = $.Localize( "#shop_activate" )
        GameEvents.SendCustomGameEventToServer_custom( "change_premium_five", {five_id: num, delete_effect: true} );
        five_selected = null;
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

function CreateItemInInventory(panel, table, i) {

    var player_table = CustomNetTables.GetTableValue("woda_player_data", String(Players.GetLocalPlayer()))
    var player_table_js = []

    for (var d = 1; d < 300; d++) {
        player_table_js.push(player_table.donate_items[d])
    }

    for ( var item of player_table_js )
    {
        if (item == table[i][0]) {
            var Recom_item = $.CreatePanel("Panel", panel, "item_inventory_" + table[i][0]);
            Recom_item.AddClass("ItemInventory");
            Recom_item.is_courier = true
            SetPetInventory(Recom_item, table[i])

            var ItemImage = $.CreatePanel("Panel", Recom_item, "");
            ItemImage.AddClass("ItemImage");
            ItemImage.style.backgroundImage = 'url("file://{images}/custom_game/shop/' + table[i][0] + '.png")';
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

            UpdateItemActivate(table[i][0])
        }
    }
}

function CreateItemInInventoryEmblems(panel, table, i) 
{

    var player_table = CustomNetTables.GetTableValue("woda_player_data", String(Players.GetLocalPlayer()))
    var player_table_js = []

    for (var d = 1; d < 300; d++) {
        player_table_js.push(player_table.donate_items[d])
    } 

    for ( var item of player_table_js )
    {
        if (item == table[i][0]) {
            var Recom_item = $.CreatePanel("Panel", panel, "item_inventory_" + table[i][0]);
            Recom_item.AddClass("ItemInventory");
            Recom_item.is_emblem = true
            SetEmblemInventory(Recom_item, table[i])

            var ItemImage = $.CreatePanel("Panel", Recom_item, "");
            ItemImage.AddClass("ItemImage");
            ItemImage.style.backgroundImage = 'url("file://{images}/custom_game/shop/' + table[i][3] + '.png")';
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

            UpdateItemActivate(table[i][0])
        }
    }
}

function CreateItemInInventoryFive(panel, table, i) 
{

    var player_table = CustomNetTables.GetTableValue("woda_player_data", String(Players.GetLocalPlayer()))
    var player_table_js = []

    for (var d = 1; d < 300; d++) 
    {
        player_table_js.push(player_table.donate_items[d])
    } 

    for ( var item of player_table_js )
    {
        if (item == table[i][0]) 
        {
            var Recom_item = $.CreatePanel("Panel", panel, "item_inventory_" + table[i][0]);
            Recom_item.AddClass("ItemInventory");
            Recom_item.is_five = true
            SetFiveInventory(Recom_item, table[i])

            var ItemImage = $.CreatePanel("Panel", Recom_item, "");
            ItemImage.AddClass("ItemImage");
            ItemImage.style.backgroundImage = 'url("file://{images}/custom_game/shop/' + table[i][3] + '.png")';
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

            UpdateItemActivate(table[i][0])
        }
    }
}

function UpdateItemActivate(id) 
{
    if (courier_selected !== null) 
    {
        if (id == courier_selected)
        {
            $("#item_inventory_"+id).FindChildTraverse("BuyItemPanel").style.backgroundColor = "gradient( linear, 0% 0%, 0% 100%, from( #84302C ), to( #60321D ))"
            $("#item_inventory_"+id).FindChildTraverse("PriceLabel").text = $.Localize( "#shop_deactivate" )
        }
    }
    if (emblem_selected !== null) 
    {
        if (id == emblem_selected)
        {
            $("#item_inventory_"+id).FindChildTraverse("BuyItemPanel").style.backgroundColor = "gradient( linear, 0% 0%, 0% 100%, from( #84302C ), to( #60321D ))"
            $("#item_inventory_"+id).FindChildTraverse("PriceLabel").text = $.Localize( "#shop_deactivate" )
        }
    }
    if (five_selected !== null) 
    {
        if (id == five_selected)
        {
            $("#item_inventory_"+id).FindChildTraverse("BuyItemPanel").style.backgroundColor = "gradient( linear, 0% 0%, 0% 100%, from( #84302C ), to( #60321D ))"
            $("#item_inventory_"+id).FindChildTraverse("PriceLabel").text = $.Localize( "#shop_deactivate" )
        }
    }
}
 
function CreateItemInInventoryTips(panel, table, i) 
{
    var player_table = CustomNetTables.GetTableValue("woda_player_data", String(Players.GetLocalPlayer()))
    let player_table_js = []
    
    for (var d = 1; d <= Object.keys(player_table.donate_items).length; d++) 
    {
        let item = player_table.donate_items[d] 

        if (item == table[i][0]) 
        {
            var Recom_item = $.CreatePanel("Panel", panel, "item_inventory_" + table[i][0]);
            Recom_item.AddClass("ItemInventory");
            Recom_item.is_tip = true
            SetTipInventory(Recom_item, table[i])

            var ItemImage = $.CreatePanel("Panel", Recom_item, "");
            ItemImage.AddClass("ItemImage");
            ItemImage.style.backgroundImage = 'url("file://{images}/custom_game/shop/' + table[i][3] + '.png")';
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

            for (var f = 1; f <= Object.keys(player_table.tips).length; f++) 
            {
                if (Number(player_table.tips[f]) == Number(table[i][0]))
                {
                    BuyItemPanel.style.backgroundColor = "gradient( linear, 0% 0%, 0% 100%, from( #84302C ), to( #60321D ))"
                    PriceLabel.text = $.Localize( "#shop_deactivate" )
                }
            }
        }
    }
}

function SelectTip(num)
{
    GameEvents.SendCustomGameEventToServer_custom( "change_premium_tip", {tip: num} );
}

function SetTipInventory(panel, table) 
{
    panel.SetPanelEvent("onactivate", function() 
    { 
        SelectTip(table[0])
    });
}

GameEvents.Subscribe_custom( 'update_tips_players_selected', update_tips_players_selected ); 

function update_tips_players_selected(data)
{
    for (var i = 0; i < $("#ItemsWindow").GetChildCount(); i++) 
    {
        if ($("#ItemsWindow").GetChild(i).is_tip != null)
        {
            $("#ItemsWindow").GetChild(i).FindChildTraverse("BuyItemPanel").style.backgroundColor = "gradient( linear, 0% 0%, 0% 100%, from( #60842c ), to( #40601d ))"
            $("#ItemsWindow").GetChild(i).FindChildTraverse("PriceLabel").text = $.Localize( "#shop_activate" )
        }
    }
    for (var i = 1; i <= Object.keys(data.tips[1]).length; i++) 
    {
        $("#item_inventory_"+data.tips[1][i]).FindChildTraverse("BuyItemPanel").style.backgroundColor = "gradient( linear, 0% 0%, 0% 100%, from( #84302C ), to( #60321D ))"
        $("#item_inventory_"+data.tips[1][i]).FindChildTraverse("PriceLabel").text = $.Localize( "#shop_deactivate" )
    }
}

GameEvents.Subscribe_custom( 'set_player_pet_from_data', set_player_pet_from_data ); 

function set_player_pet_from_data(data) 
{
    var pet_id = data.pet_id
    courier_selected = pet_id
}

GameEvents.Subscribe_custom( 'set_player_effect_from_data', set_player_effect_from_data ); 

function set_player_effect_from_data(data) 
{
    var effect_id = data.effect_id
    emblem_selected = effect_id
}

GameEvents.Subscribe_custom( 'set_player_five_from_data', set_player_five_from_data ); 

function set_player_five_from_data(data) 
{
    var five_id = data.five_id
    five_selected = five_id
}

// Уведомления

var timer_loading = -1

GameEvents.Subscribe_custom( 'shop_error_notification', ErrorCreated );
GameEvents.Subscribe_custom( 'shop_accept_notification', AcceptCreated );
GameEvents.Subscribe_custom( 'shop_set_currency', SetCurrency );

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

    if( timer_loading != -1 )
    {
        $.CancelScheduled(timer_loading)
    }

    LoadingClose()

    $("#donate_accept_window").style.visibility = "visible"

    //SetMainCurrency()

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
        if (typeof data.crystall !== 'undefined') {
            //$("#CrystalLabelCount").text = String(data.crystall)
        }
        if (typeof data.coin !== 'undefined') {
            $("#CoinLabelCount").text =  String(data.coin)   
        }
        if (typeof data.plus_days !== 'undefined') {
            //$("#WodaplusLabelCount").text =  String(data.plus_days)   
        }
    }
}

var PROMO_COOLDOWN = false

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

        if (full_place == 0)
        {
            return
        }

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

function UpdateFreeReward(fast)
{
    let panel = $("#FreeReward")
    if (fast)
    {
        panel.SetHasClass("free_reward_accepted", true)
        panel.SetHasClass("GetReward", false)
        panel.SetPanelEvent("onactivate", function() {} );
    } else {
        var localplayer_data = CustomNetTables.GetTableValue("woda_player_data", String(Players.GetLocalPlayer()));
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

var HERO_VOTES_TABLE = 
[
    "npc_dota_hero_lina",
    "npc_dota_hero_dawnbreaker",
    "npc_dota_hero_ursa",
    "npc_dota_hero_luna",
    "npc_dota_hero_sniper",
    "npc_dota_hero_mirana",
    "npc_dota_hero_winter_wyvern",
]

var HERO_VOTES_TABLE_MAX_COUNT = 500000

function InitHeroVotes()
{
    $("#HeroListVotes").RemoveAndDeleteChildren()
    let heroes_votes = CustomNetTables.GetTableValue("heroes_votes", "heroes_votes")
    let heroes_table = GenerateTableVotes(heroes_votes)

    for (var i = 0; i < Object.keys(HERO_VOTES_TABLE).length; i++) 
    {
        CreateHeroPanelVotes($("#HeroListVotes"), HERO_VOTES_TABLE[i], heroes_table[HERO_VOTES_TABLE[i]])
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
    //var HeroImage = $.CreatePanel(`DOTAHeroImage`, HeroBuy, "", {scaling: "stretch-to-cover-preserve-aspect", heroname : String(hero_name), tabindex : "auto", class: "HeroPortrait", heroimagestyle : "portrait"});

    let vid = $.CreatePanel("MoviePanel", HeroVoteMainPanel, 'portrait_' + hero_name, {
        class: "hero_portrait_hover_votes",
        src: "file://{resources}/videos/heroes/" + hero_name + ".webm",
        repeat: "true",
        hittest: "false",
        autoplay: "onload"
    });

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
    } else {
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
    } else
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
    var player_table = CustomNetTables.GetTableValue("woda_player_data", String(Players.GetLocalPlayer()))
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