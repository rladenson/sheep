module.exports = {
	data: {
		name: 'reload',
		description: 'Reload the bot (or parts of it)',
		options: [{
			name: 'value',
			description: 'What to reload',
			type: 3,
			choices: [
				{
					name: 'bot',
					value: 'bot'
				},
				{
					name: 'slash_commands',
					value: 'scmds'
				},
				{
					name: 'commands',
					value: 'cmds'
				}
			],
			required: true
		}]
	},
	usage: [
		"[value: bot] - Crash and restart the bot",
		"[value: slash_commands] - Reload all slash commands",
		"[value: commands] - Reload all commands"
	],
	async execute(ctx) {
		var arg = ctx.options.get('value').value.trim();
		
		switch(arg) {
			case 'bot':
				await ctx.reply('Rebooting!');
				process.exit(0);
			case 'scmds':
				await ctx.deferReply();
				await ctx.client.handlers.interaction.load(
					__dirname + '/..'
				);
				return 'Reloaded!'
			case 'cmds':
				await ctx.deferReply();
				await ctx.client.handlers.command.load(
					__dirname + '/../../commands'
				);
				return 'Reloaded!'
		}
	}
}