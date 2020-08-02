const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs');
const auth = require('./auth.json');
var history = new Map();
var interval = 5000;
client.login(auth.discord);
client.on('ready', () => {
    fs.readFile('settings.set', 'utf8', function (err, data) {
        if (err) {
            fs.writeFile('./settings.set', JSON.stringify(new Map()), function (err) {
                if (err) return console.log(err);
                console.log('⚠️ Stworzono plik ustawień');
            });
            return console.log('❌ ' + err);
        }
        history = JSON.parse(data);
        console.log('✅ wczytano ustawienia bota');
    });
});
client.on('message', msg => {
    if (msg.author.bot) return;
    /*Premisje*/
    //console.log(msg.member.roles.cache.some(role=>(role.permissions>>>3)%2===1));
    /*koniec*/
    if (msg.guild == null) {
        return;
    }

    if (history[msg.guild.id] == null) history[msg.guild.id] = new Map();
    if (history[msg.guild.id][msg.author.id] == null) history[msg.guild.id][msg.author.id] = new Map();
    if (history[msg.guild.id][msg.author.id]['correct'] == null) history[msg.guild.id][msg.author.id]['correct'] = 0;
    if (history[msg.guild.id][msg.author.id]['wrong'] == null) history[msg.guild.id][msg.author.id]['wrong'] = 0;
    if (history[msg.guild.id][msg.author.id]['speed'] == null) history[msg.guild.id][msg.author.id]['speed'] = 0;
    if (history[msg.guild.id][msg.author.id]['last'] == null) history[msg.guild.id][msg.author.id]['last'] = 0;
    if (msg.content == '!set here' && msg.guild.owner == msg.author) {
        history[msg.guild.id]['chanel'] = msg.channel.id;
        msg.channel.send("👌😂");
        return;
    }
    if (msg.content.startsWith('!') && history[msg.guild.id]['chanel'] != msg.channel.id) {
        var args = msg.content.substring(1).split(' ');
        var cmd = args[0].toLowerCase();
        args = args.splice(1);
        switch (cmd) {
            case 'user':
                let user=msg.mentions.members.first();
                if(user==null){
                    msg.channel.send('nie istnieje');
                    break;
                }
                if(history[msg.guild.id][user.id]==null){
                    msg.channel.send(user.username+' nic nie wysłał');
                    break;
                }
                msg.channel.send(user.username+' wysłał '+history[msg.guild.id][user.id]['correct']
                +' 👌😂 oraz '+(history[msg.guild.id][user.id]['wrong']+history[msg.guild.id][user.id]['speed'])+' niepoprawnych');
                break;
        }
    }
    if (history[msg.guild.id]['chanel'] == msg.channel.id) {
        if (Date.now() < history[msg.guild.id][msg.author.id]['last'] + interval) {
            msg.author.send('Jesteś za szybki!');
            msg.delete();
            history[msg.guild.id][msg.author.id]['speed']++;
            history[msg.guild.id][msg.author.id]['last'] = Date.now();
            return;
        }

        testexpr = new RegExp("^👌[ ]{0,1}😂[ \n]*")
        if (testexpr.test(msg.content)) {
            history[msg.guild.id][msg.author.id]['correct']++;
            msg.channel.send('👌😂');
        } else {
            history[msg.guild.id][msg.author.id]['wrong']++;
            msg.author.send(`I don't think it's 👌😂`);
            msg.delete();
        }
        history[msg.guild.id][msg.author.id]['last'] = Date.now();
    }
    fs.writeFile('./settings.set', JSON.stringify(history), function (err) {
        if (err) return console.log(err);
    });
});