const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs');
const auth = require('./auth.json');
var history = new Map();
var interval = 5000;
var tasks = [];
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
var has_f = false;
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
function removeMSG(msgRM2){
    let msgRM=new Discord.Message();
    msgRM=msgRM2;
    msgRM.delete();
}
function main(msg2) {
    var msg = new Discord.Message();
    msg = msg2;
    if (history[msg.guild.id]['chanel'] != msg.channel.id
        && msg.content == '!set here' && msg.guild.owner.id == msg.author.id) {
        history[msg.guild.id]['chanel'] = msg.channel.id;
        msg.channel.send("👌😂");
        return;
    }
    if (history[msg.guild.id]['chanel'] == msg.channel.id) {
        if (Date.now() < history[msg.guild.id][msg.author.id]['last'] + interval) {
            msg.author.send('Jesteś za szybki!');
            msg.delete();
            history[msg.guild.id][msg.author.id]['speed']++;
            history[msg.guild.id][msg.author.id]['last'] = Date.now();
            return;
        }
        if(history[msg.guild.id]['last']==msg.author.id){
            history[msg.guild.id][msg.author.id]['wrong']++;
            msg.author.send(`You can't send two 👌😂 in a row`);
            msg.delete();
            return;
        }
        testexpr = new RegExp("^👌[ ]{0,1}😂[ \n]*")
        if (testexpr.test(msg.content)) {
            history[msg.guild.id][msg.author.id]['correct']++;
            history[msg.guild.id]['last']=msg.author.id;
            msg.channel.send('👌😂').then(
                sendMSG => setTimeout(removeMSG,5000,sendMSG)
            );
            
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
                let rank=[];
                for(key in history[msg.guild.id]){
                    if(history[msg.guild.id][key]['nick']!=null){
                        rank.push(history[msg.guild.id][key]);
                    }
                }
                    rank.sort(function(a, b) {
                        return parseFloat(b[ 'correct']) - parseFloat(a['correct']);
                    });
                    let membed = new Discord.MessageEmbed().setTitle('Ranking:').setColor(0x008E44);
                for(let i=0;i<Math.min(((args[0]!=null)?parseInt(args[0]):5),rank.length);i++){
                    membed.addField( (i+1)+'.'+rank[i]['nick'],'Wynik: '+rank[i]['correct']);
                }
                msg.channel.send(membed);
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