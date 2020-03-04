#!/usr/bin/env node

const program = require('commander')
const chalk = require('chalk')
const minimist = require('minimist')

const enhanceErrorMessages = require('./utils/enhanceErrorMessages')

enhanceErrorMessages('missingArgument', argName => {
  return `Missing required argument ${chalk.yellow(`<${argName}>`)}.`
})

program
  .command('create <project-name>')
  .description('create a new project with vunt-template')
  .action(name => {
    if (minimist(process.argv.slice(3))._.length > 1) {
      console.log(chalk.yellow('\n Info: You provided more than one argument. The first one will be used as the app\'s name, the rest are ignored.'))
    }

    require('./create')(name)
  })

if (process.platform === "win32") {
  const rl = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout
  })

  rl.on("SIGINT", function () {
    process.emit("SIGINT");
  })
}

process.on("SIGINT", function () {
  //graceful shutdown
  process.exit();
})

program.commands.forEach(c => c.on('--help', () => console.log()))

program.parse(process.argv)
if (program.args.length < 1) return program.help()
