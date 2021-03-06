/* eslint no-console:off */
const inquirer = require('inquirer');
const colors = require('colors'); // eslint-disable-line
const gameLevels = 2;

const lineBreak = () => console.log('\n');

const signupQuestions = [
    {
        type: 'list',
        name: 'auth',
        message: 'Are you a new or returning user?\n\n',
        choices: [{ name:'This is my first time, sign me up!', value: 'signUp' }, { name: 'I\'ve been here before, sign me in!', value: 'signIn' }]
    },
    {
        type: 'input',
        name: 'name',
        message: 'Please enter your username'
    },
    {
        type: 'password',
        name: 'password',
        message: 'Please enter your password'
    }
];

class Game {
    constructor(api) {
        this.api = api;
    }
    start() {
        inquirer.prompt(signupQuestions)
            .then(({ auth, name, password }) => this.api[auth]({ name, password }))
            .then(({ token, name, userId }) => {
                this.user = name;
                this.api.token = token;
                this.presentTask(userId);
            })
            .catch(err => {
                lineBreak();
                console.log(JSON.parse(err.response.text).error.yellow, 'Please try again!'.bold.cyan);
                this.start();
            });
    }
    presentTask(userId) {
        this.api.getTask(userId, this.api.token)
            .then(task => {
                lineBreak();                
                console.log(task.intro.replace('(User Name)', this.user).blue);
                this.showOptions(userId);
            });
    }
    showOptions(userId) {
        lineBreak();        
        inquirer.prompt({
            type: 'list',
            name: 'direction',
            message: 'Which direction would you like to fly?',
            choices: [{ name:'North', value: 'n' },
                { name: 'South', value: 's' },
                { name: 'East', value: 'e' },
                { name: 'West', value: 'w' }]
        })
            .then(({ direction }) => {
                this.resolveAction(userId, direction);
            });
    }
    resolveAction(userId, direction) {       
        this.api.getOption(userId, direction)
            .then(body => {
                switch(body.action) {
                    case 'look':
                        lineBreak();
                        console.log(`${body.info} You fly back.`.cyan);
                        this.showOptions(userId);
                        break;
                    case 'interact':
                        this.addToInventory(userId, body.info);
                        break;
                    case 'resolve':
                        this.completeTask(userId, body.info);
                }
            });   
    }
    addToInventory(userId, itemInfo) {
        this.api.getInventory(userId)
            .then(body => {
                if(body.inventory[0] === itemInfo.type) {
                    lineBreak();                    
                    console.log(`This is where you found your ${body.inventory[0]}. You fly back.`.magenta);
                    this.showOptions(userId);
                } else {
                    lineBreak();
                    console.log(itemInfo.itemDesc.cyan);
                    this.api.addItem(userId, itemInfo.type)
                        .then(body => {
                            lineBreak();                
                            console.log(`You fly back with a ${body.inventory[0]}.`.magenta);
                            this.showOptions(userId);                
                        });
                }
            });
    }
    completeTask(userId, endpointInfo) {
        this.api.getInventory(userId)
            .then(body => {
                if(body.inventory[0] === endpointInfo.requiredItem) {
                    lineBreak();                                        
                    console.log(`${endpointInfo.desc} ${endpointInfo.resolved}`.cyan);
                    this.endLevel(userId);
                } else {
                    lineBreak();                    
                    console.log(`${endpointInfo.desc} ${endpointInfo.unresolved} You fly back.`.cyan);
                    this.showOptions(userId);                
                }
            });
    }
    endLevel(userId) {
        this.api.deleteInventory(userId)
            .then(({ inventory }) => {
                if(inventory.length === 0) {
                    return this.api.getLevel(userId);
                }
            })
            .then(({ level }) => {
                if(level === gameLevels) {
                    lineBreak();                                    
                    inquirer.prompt({
                        type: 'list',
                        name: 'newGame',
                        message: 'The End. Would you like to play again?',
                        choices: [{ name:'Yes!', value: 'yes' }]
                    })
                        .then(({ newGame }) => {
                            if(newGame) this.newLevel(userId, 1);
                        });
                } else {
                    this.newLevel(userId, level + 1);
                }
            });
    }
    newLevel(userId, newLevel) {
        this.api.updateLevel(userId, newLevel)
            .then(() => {
                this.presentTask(userId);
            });
    }
}

module.exports = Game;