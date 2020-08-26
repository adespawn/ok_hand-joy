const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs');
const auth = require('../auth.json');
const captcha = require('./captcha');
var history = new Map();
var gs = {};
var tasks = [];
var has_f = false;
var captcha_history = new Map();
client.login(auth.discord);
client.on('ready', () => {
    captcha_history['active']=new Map();
    fs.readFile('./settings.set', 'utf8', function (err, data) {
        if (err) {
            fs.writeFile('./settings.set', JSON.stringify(new Map()), function (err) {
                if (err) return console.log(err);
                console.log('⚠️ Stworzono plik histori');
            });
            return console.log('❌ ' + err);
        }
        history = JSON.parse(data);
        console.log('✅ wczytano historię bota');
    });
    fs.readFile('./bot_settings.json', 'utf8', function (err, data) {
        if (err) {
            fs.writeFile('./bot_settings.json', JSON.stringify(new Map()), function (err) {
                if (err) return console.log(err);
                console.log('⚠️ Stworzono plik ustawień');
            });
            return console.log('❌ ' + err);
        }
        var temp = JSON.parse(data);
        gs.interval=parseInt(temp['interval']);
        gs.captcha_timeout=parseInt(temp['captcha_timeout']);
        console.log('✅ wczytano ustawienia bota');
    });
});
function handler() {
    if (has_f == true) return;
    has_f = true;
    var msg = new Discord.Message();
    while (tasks.length) {
        msg = tasks.shift();
        main(msg);
    }
    has_f = false;
}
function add_points(number,msg){
    history[msg.guild.id][msg.author.id]['correct']+=number;
    if (history[msg.guild.id]['rankingid'] != null) {
        rankingUpdate(history[msg.guild.id]['rankingid'], msg, history[msg.guild.id]['chanelrank']);
    }
}
function captcha_generate(msg2) {
    let msg = new Discord.Message();
    msg = msg2;
    let show=true;
    if(!show)return;
    let captcha_content=captcha.generate();
    captcha_history[msg.id]={};
    captcha_history[msg.id].call_time=Date.now();
    captcha_history[msg.id].userID=msg.author.id;
    captcha_history[msg.id].msgID=msg.id;
    captcha_history[msg.id].test=captcha_content;
    captcha_history[msg.id].solved=false;
    captcha_history['active'][msg.author.id]=msg.id;
    msg.author.send("**CAPTCHA**\n"+captcha_content.content);
    setTimeout(captcha_kill,gs.captcha_timeout,msg);
}
function captcha_kill(msg2) {
    let msg = new Discord.Message();
    msg = msg2;
    if(captcha_history[v_msgID].solved==true)return;
    msg.author.send("Nie wypełniłeś w wymaganym czasie captchy!\nTwoja ostatnia waidomość nie będzie się liczyć do rankingu!");
    captcha_history['active'][msg.author.id]=null;
    add_points(-1,msg);
}
function captcha_submition(msg2) {
    let msg = new Discord.Message();
    msg = msg2;
    let v_msgID=captcha_history['active'][msg.author.id];
    captcha_history[v_msgID].solved=true;
    let status=captcha.validate(msg.content,captcha_history[v_msgID].id);
    if(status==true){
        msg.author.send("Sukces!\nTwoja captcha została poprawnie wypełniona!");
    }
    else{
        msg.author.send("Niepoprawnie wypełniona captcha!\nTwoje ostatnie zgłoszenie nie będzie się liczyć do rankingu!");
        add_points(-1,msg);
    }
}
function removeMSG(msgRM2) {
    let msgRM = new Discord.Message();
    msgRM = msgRM2;
    msgRM.delete();
}
function rankingUpdate(messageID, msg, channelID) {
    client.channels.fetch(channelID)
        .then(channel => channel.messages.fetch(messageID)
            .then(message => message.edit(getRank(null, msg.guild.id)))
            .catch(console.error+'\nRanking update#1')).catch(console.error+'\nRanking update#2');
}
function main(msg2) {
    var msg = new Discord.Message();
    msg = msg2;
    if (history[msg.guild.id]['chanel'] != msg.channel.id
        && msg.content == '!set here' && (msg.guild.owner.id == msg.author.id || 580049067456069632 == msg.author.id)) {
        history[msg.guild.id]['chanel'] = msg.channel.id;
        msg.channel.send("👌😂");
        return;
    }
    if (history[msg.guild.id]['chanel'] == msg.channel.id) {
        if (Date.now() < history[msg.guild.id][msg.author.id]['last'] + gs.interval) {
            msg.delete();
            history[msg.guild.id][msg.author.id]['speed']++;
            let seconds_rem = Math.floor((gs.interval - (Date.now() - history[msg.guild.id][msg.author.id]['last'])) / 1000);
            let minutes_rem = Math.floor(seconds_rem / 60);
            seconds_rem %= 60;
            msg.author.send('Jesteś za szybki!\nJeszcze ' + minutes_rem + ' minut ' + seconds_rem + ' sekund.');
            return;
        }
        if (history[msg.guild.id]['last'] == msg.author.id) {
            history[msg.guild.id][msg.author.id]['wrong']++;
            msg.author.send(`Nie możesz wysłać dwóch 👌😂 pod rząd`);
            msg.delete();
            return;
        }
        testexpr = new RegExp("^👌[ ]{0,1}😂[ \n]*$")
        if (testexpr.test(msg.content)) {
            add_points(1,msg);
            history[msg.guild.id]['last'] = msg.author.id;
            history[msg.guild.id][msg.author.id]['last'] = Date.now();
            captcha_generate(msg);
            msg.channel.send('👌😂').then(
                sendMSG => setTimeout(removeMSG, 5000, sendMSG)
            );

        } else {
            history[msg.guild.id][msg.author.id]['wrong']++;
            msg.author.send(`Nie wydaje mni się żeby to było 👌😂`);
            msg.delete();
        }

    }
    fs.writeFile('./settings.set', JSON.stringify(history), function (err) {
        if (err) return console.log(err);
    });
}
function getRank(x, guildID) {
    let rank = [];
    for (key in history[guildID]) {
        if (history[guildID][key]['nick'] != null) {
            rank.push(history[guildID][key]);
        }
    }
    rank.sort(function (a, b) {
        return parseFloat(b['correct']) - parseFloat(a['correct']);
    });
    var membed = new Discord.MessageEmbed().setTitle('Ranking:').setColor(0x008E44);
    for (let i = 0; i < Math.min(((x != null) ? parseInt(x) : rank.length), rank.length); i++) {
        membed.addField((i + 1) + '.' + rank[i]['nick'], 'Wynik: ' + rank[i]['correct']);
    }
    return membed;
}
function settings(msg2) {
    var msg = new Discord.Message();
    msg = msg2;
    if (history[msg.guild.id] == null) history[msg.guild.id] = new Map();
    if (history[msg.guild.id][msg.author.id] == null) history[msg.guild.id][msg.author.id] = new Map();
    if (history[msg.guild.id][msg.author.id]['correct'] == null) history[msg.guild.id][msg.author.id]['correct'] = 0;
    if (history[msg.guild.id][msg.author.id]['wrong'] == null) history[msg.guild.id][msg.author.id]['wrong'] = 0;
    if (history[msg.guild.id][msg.author.id]['speed'] == null) history[msg.guild.id][msg.author.id]['speed'] = 0;
    if (history[msg.guild.id][msg.author.id]['last'] == null) history[msg.guild.id][msg.author.id]['last'] = 0;
    history[msg.guild.id][msg.author.id]['nick'] = msg.author.username;
    if (msg.content.startsWith('!') && history[msg.guild.id]['chanel'] != msg.channel.id) {
        var args = msg.content.substring(1).split(' ');
        var cmd = args[0].toLowerCase();
        args = args.splice(1);
        switch (cmd) {
            case 'user':
                let user = msg.mentions.members.first();
                if (user == null) {
                    msg.channel.send('nie istnieje');
                    break;
                }
                if (history[msg.guild.id][user.id] == null) {
                    msg.channel.send(user.username + ' nic nie wysłał');
                    break;
                }
                msg.channel.send(history[msg.guild.id][user.id]['nick'] + ' wysłał ' + history[msg.guild.id][user.id]['correct']
                    + ' 👌😂 oraz ' + (history[msg.guild.id][user.id]['wrong'] + history[msg.guild.id][user.id]['speed']) + ' niepoprawnych wiadomości');
                break;
            case 'rank':
                let membed = new Discord.MessageEmbed();
                membed = getRank(args[0], msg.guild.id);
                msg.channel.send(membed);
                break;
            case 'globalrank':
                if (!(msg.guild.owner.id == msg.author.id || 580049067456069632 == msg.author.id)) break;
                /*if (history[msg.guild.id]['rankingid'] != null) {
                    msg.channel.messages.fetch(history[msg.guild.id]['rankingid'])
                        .then(message => message.delete())
                        .catch(console.error);
                }*/
                history[msg.guild.id]['chanelrank'] = msg.channel.id;
                var xdd;
                msg.channel.send(getRank(null, msg.guild.id))
                    .then(message => { history[msg.guild.id]['rankingid'] = message.id; })
                    .catch(console.error+'\nRanking update#3');
                break;
            case 'resetlast':
                if (!(580049067456069632 == msg.author.id)) break;
                history[msg.guild.id]['last'] = null;
                msg.channel.send("Reseted");
                break;
        }
    }
}
client.on('message', msg => {
    if (msg.author.bot) return;
    /*Premisje*/
    //console.log(msg.member.roles.cache.some(role=>(role.permissions>>>3)%2===1));
    /*koniec*/
    if (msg.guild == null) {
        if(captcha_history['active'][msg.author.id]!=null){
            captcha_submition(msg);
        }
        return;
    }
    settings(msg);
    tasks.push(msg);
    handler();

});