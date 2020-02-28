const fs = require('fs-extra')
const path = require('path')
const readline = require('readline')
const validateProjectName = require('validate-npm-package-name')
const inquirer = require('inquirer')
const download = require('download-git-repo')
const ora = require('ora')
const chalk = require('chalk')

function run (command, args) {
  if (!args) { [command, ...args] = command.split(/\s+/) }
  return execa(command, args, { cwd: this.context })
}

async function clearConsole(title) {
  if (process.stdout.isTTY) {
    const blank = '\n'.repeat(process.stdout.rows)
    console.log(blank)
    readline.cursorTo(process.stdout, 0, 0)
    readline.clearScreenDown(process.stdout)
    if (title) {
      console.log(title)
    }
  }
}

async function create(projectName) {
  // Get Node.js working directory
  const cwd = process.cwd()

  // See if is create in current directoy
  const inCurrent = projectName === '.'

  // If create in current directory, get the folder name.
  const name = inCurrent ? path.relative('../', cwd) : projectName

  // Get absolute path for the project
  const targetDir = path.resolve(cwd, projectName || '.')

  const result = validateProjectName(name)

  if (!result.validForNewPackages) {
    console.error(chalk.red(`Invalid project name: "${name}"`))
    result.errors && result.errors.forEach(err => {
      console.error(chalk.red.dim('Error: ' + err))
    })
    result.warnings && result.warnings.forEach(warn => {
      console.error(chalk.red.dim('Warning: ' + warn))
    })
    exit(1)
  }

  if (fs.existsSync(targetDir)) {
    await clearConsole()

    if (inCurrent) {
      const { ok } = await inquirer.prompt([
        {
          name: 'ok',
          type: 'confirm',
          message: `Generate project in current directory?`
        }
      ])
      if (!ok) {
        return
      }
    } else {
      const { action } = await inquirer.prompt([
        {
          name: 'action',
          type: 'list',
          message: `Target directory ${chalk.cyan(targetDir)} already exists. Pick an action:`,
          choices: [
            { name: 'Overwrite', value: 'overwrite' },
            { name: 'Cancel', value: false }
          ]
        }
      ])
      if (!action) {
        return
      } else if (action === 'overwrite') {
        console.log(`\nRemoving ${chalk.cyan(targetDir)}...`)
        await fs.remove(targetDir)
      }
    }
  }

  const spinner = ora('Downloading vunt-template')
  spinner.start()
  download('github:plrabbit/vunt', targetDir, function (err) {
    spinner.stop()
    if (err) console.log('Failed to download vunt-template. ' + chalk.redBright(err.message.trim()))
    else {
      console.log(chalk.greenBright('Finished.'))
      require('generator')({
        projectName: name
      }, targetDir)
    }
  })
}

module.exports = (...args) => {
  return create(...args).catch(err => {
    console.log(chalk.red(err))
  })
}