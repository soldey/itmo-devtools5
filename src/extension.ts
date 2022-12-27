// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import {
	existsSync, 
	mkdirSync, 
	readdirSync, 
	copyFileSync, 
	unlinkSync,
	readFileSync,
	writeFileSync } from 'fs';
import { resolve } from 'path';
import * as shelljs from 'shelljs';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "easy-projects" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('easy-projects.getGitignore', async () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		const inputValue = await vscode.window.showInputBox({
			title: "Enter your language",
			placeHolder: "Language"
		});

		if (inputValue === undefined) {
			vscode.window.showErrorMessage("You have not written language you are interested in");
			return;
		}
		console.log(inputValue);
		getRepositoryCached();
		let fileList: string[] = [];
		readdirSync(resolve(__dirname, '.cache', 'gitignore')).forEach(file => {
			if (
				file.toLowerCase().match(
					new RegExp("[a-zA-Z0-9]*" + inputValue.toLowerCase() + "[a-zA-Z0-9]*.gitignore")
					)
				) {
				fileList.push(file);
			}
		});
		console.log(fileList);
		if (fileList.length === 0) {
			vscode.window.showInformationMessage("Easy project: no such gitignore template");
			return;
		}
		const option = await vscode.window.showQuickPick(fileList);
		if (option === undefined) {
			vscode.window.showErrorMessage("You have not chosen file");
			return;
		}
		console.log(option);
		let wf = "";
		if(vscode.workspace.workspaceFolders !== undefined) {
			wf = vscode.workspace.workspaceFolders[0].uri.path ;
		
			const message = `Easy project: folder: ${wf}` ;
		
			vscode.window.showInformationMessage(message);
		} 
		else {
			const message = "Easy project: Working folder not found, open a folder an try again" ;
		
			vscode.window.showErrorMessage(message);
			return;
		}
		wf = wf.substring(1);
		if (existsSync(resolve(wf, '.gitignore'))) {
			const message = "You already have gitignore in your folder. Do you want to perform overwrite or merge?";
			vscode.window.showInformationMessage(message, "Overwrite", "Merge", "Cancel")
			.then(async (answer) => {
				if (answer === "Overwrite") {
					await overwriteFile(wf, option);
				}
				else if (answer === "Merge") {
					await mergeFile(wf, option);
				}
				else {
					return;
				}
			});
		} else {
			await copyFile(wf, option);
		}
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}

function getRepositoryCached() {
	// If the cache folder doesn't exist, create it
	console.log(__dirname);
	if (!existsSync(resolve(__dirname, '.cache'))) {
		mkdirSync(resolve(__dirname, '.cache'));
	}
	if (!existsSync(resolve(__dirname, '.cache', 'gitignore'))) {
		const url = "https://github.com/github/gitignore";
		const shell = shelljs;
		shell.config.execPath = shell.which('node')!.toString();
		shell.cd(resolve(__dirname, '.cache'));
		console.log(resolve(__dirname, '.cache'));
		shell.exec("git clone " + url);
	}
}

async function overwriteFile(wf: string, option: string) {
	await unlinkSync(resolve(wf, '.gitignore'));
	copyFileSync(
		resolve(__dirname, '.cache', 'gitignore', option),
		resolve(wf, '.gitignore')
		);
}

async function mergeFile(wf: string, option: string) {
	const data = await readFileSync(resolve(__dirname, '.cache', 'gitignore', option),
				{encoding:'utf8', flag:'r'});
	writeFileSync(resolve(wf, '.gitignore'), data);
}

async function copyFile(wf: string, option: string) {
	copyFileSync(
		resolve(__dirname, '.cache', 'gitignore', option),
		resolve(wf, '.gitignore')
		);
}
