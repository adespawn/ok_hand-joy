const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs');
const auth = require('../auth.json');
var history = new Map();
var gs = {};
var tasks = [];
var has_f = false;
var captcha_history = new Map();
client.login(auth.discord);
client.on('ready', () => {
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
        gs.interval = parseInt(temp['interval']);
        gs.captcha_timeout = parseInt(temp['captcha_timeout']);
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
function captcha_generate(msg2) {
    let msg = new Discord.Message();
    msg = msg2;

}
function removeMSG(msgRM2) {
    let msgRM = new Discord.Message();
    msgRM = msgRM2;
    msgRM.delete();
}
function rankingUpdate(messageID, msg, channelID) {
    client.channels.fetch(channelID)
        .then(channel => channel.messages.fetch(messageID)
            .then(message => message.edit(getRanking(null, msg.guild.id)))
            .catch(console.error)).catch(console.error);
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
            msg.author.send(`Jesteś za szybki!\nJeszcze ${(minutes_rem>0)?(minutes_rem+ ' minut '):''}${seconds_rem} sekund.`); 
            return;
        }
        if (history[msg.guild.id]['last'] == msg.author.id) {
            history[msg.guild.id][msg.author.id]['wrong']++;
            msg.author.send(`Nie możesz wysłać dwóch 👌😂 pod rząd`);
            msg.delete();
            return;
        }
        testexpr = new RegExp("^👌[ ]{0,1}😂[ \n]*$");
        if (testexpr.test(msg.content) && msg.attachments.size == 0 && msg.reference == null) {
            history[msg.guild.id][msg.author.id]['correct']++;
            history[msg.guild.id]['last'] = msg.author.id;
            history[msg.guild.id][msg.author.id]['last'] = Date.now();
            captcha_generate(msg);
            if (history[msg.guild.id]['rankingid'] != null) {
                rankingUpdate(history[msg.guild.id]['rankingid'], msg, history[msg.guild.id]['chanelrank']);
            }
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
function getRanking(x, guildID) {
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
        if (rank[i]['correct'] == 0) break;
        membed.addField(`${(i + 1)}.${((rank[i]['nick'][0]==':')?'\\':'')}${rank[i]['nick']}`, `Wynik: ${rank[i]['correct']}`);
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
    history[msg.guild.id][msg.author.id]['nick'] = msg.member.nickname;
    if (msg.content.startsWith('!') && history[msg.guild.id]['chanel'] != msg.channel.id) {
        var args = msg.content.substring(1).split(' ');
        var cmd = args[0].toLowerCase();
        args = args.splice(1);
        switch (cmd) {
            case 'user':
                let user = msg.mentions.members.first();
                let person = msg.mentions.members.first().user;
                if (user == null) {
                    msg.channel.send(`Nie wskazałeś użytkownika`);
                    break;
                }
                if (history[msg.guild.id][user.id] == null) {
                    msg.channel.send(`${(user.nickname!=null&&user.nickname!=person.username)?user.nickname+' ('+person.username+')':person.username} nic nie wysłał`);
                    break;
                }
                msg.channel.send(`${history[msg.guild.id][user.id]['nick']} wysłał ${history[msg.guild.id][user.id]['correct']} 👌😂 oraz ${(history[msg.guild.id][user.id]['wrong'] + history[msg.guild.id][user.id]['speed'])} niepoprawnych wiadomości`);
                break;
            case 'rank':
                let membed = new Discord.MessageEmbed();
                membed = getRanking(args[0], msg.guild.id);
                msg.channel.send(membed);
                break;
            case 'globalrank':
                if (!(msg.guild.owner.id == msg.author.id || 580049067456069632 == msg.author.id)) break;
                history[msg.guild.id]['chanelrank'] = msg.channel.id;
                var xdd;
                msg.channel.send(getRanking(null, msg.guild.id))
                    .then(message => { history[msg.guild.id]['rankingid'] = message.id; })
                    .catch(console.error);
                break;
            case 'resetlast':
                if (!(580049067456069632 == msg.author.id)) {
                    msg.channel.send(`Admin only command`).then(
                        sendMSG => setTimeout(removeMSG, 5000, sendMSG)
                    );
                    break;
                }
                history[msg.guild.id]['last'] = null;
                msg.channel.send(`Reseted`).then(
                    sendMSG => setTimeout(removeMSG, 5000, sendMSG)
                );
                setTimeout(removeMSG, 5000, msg)
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
        return;
    }
    settings(msg);
    tasks.push(msg);
    handler();

});