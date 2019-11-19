module.exports = {
	help: ()=> "Lists all server-based color roles",
	usage: ()=> [" - Lists currently indexed roles",
				 " create [name] [color] - Creates new color role and indexes it",
				 " edit [color|name] [name] [value] - Edits an indexed role. Can change the role's color or name",
				 " reset - Deletes all indexed color roles and switches to user-based roles"],
	execute: async (bot, msg, args, config = {role_mode: 0}) => {
		var roles = await bot.utils.getServerRoles(bot, msg.guild);
		if(!roles || !roles[0]) return "No indexed roles";
		if(!roles.find(r => r.name != "invalid")) {
			var success = await bot.utils.resetServerRoles(bot, msg.guild.id);
			if(success) return "No valid color roles found. Database successfully reset";
			else return "No valid color roles found. Database failed to reset"
		}

		var invalid = roles.filter(r => r.name == "invalid" && r.color == undefined);
		var content;
		if(invalid.length > 0) {
			var success = await bot.utils.deleteServerRoles(bot, msg.guild.id, invalid.map(r => r.id));
			if(success) content = "Any invalid roles have been deleted from the database";
			else content = "Invalid roles could not be deleted from the database";
		}

		if(roles.length <= 10) {
			return {content: content ? content : "", embed: {
				title: "Server Color Roles",
				description: "name : color",
				fields: roles.filter(r => r.name != "invalid" && r.color != undefined).map(r => {
					return {name: r.name, value: `#${r.color.toString(16).toUpperCase()}`}
				})
			}}
		} else {
			var embeds = await bot.utils.genEmbeds(bot, roles, (r) => {
				if(r.name != "invalid" && r.color != undefined) {
					return {name: r.name, value: `#${r.color.toString(16).toUpperCase()}`}
				}
			}, {
				title: "Server Color Roles",
				description: "name : color"
			},10);

			var message = await msg.channel.createMessage(embeds[0]);
			if(!bot.menus) bot.menus = {};
			bot.menus[message.id] = {
				user: msg.author.id,
				data: embeds,
				index: 0,
				timeout: setTimeout(()=> {
					if(!bot.pages[message.id]) return;
					message.removeReaction("\u2b05");
					message.removeReaction("\u27a1");
					message.removeReaction("\u23f9");
					delete bot.pages[msg.author.id];
				}, 900000),
				execute: async function(m, emoji) {
					switch(emoji.name) {
						case "\u2b05":
							if(this.index == 0) {
								this.index = this.data.length-1;
							} else {
								this.index -= 1;
							}
							await bot.editMessage(m.channel.id, m.id, this.data[this.index]);
							await bot.removeMessageReaction(m.channel.id, m.id, emoji.name, msg.author.id)
							bot.menus[m.id] = this;
							break;
						case "\u27a1":
							if(this.index == this.data.length-1) {
								this.index = 0;
							} else {
								this.index += 1;
							}
							await bot.editMessage(m.channel.id, m.id, this.data[this.index]);
							await bot.removeMessageReaction(m.channel.id, m.id, emoji.name, msg.author.id)
							bot.menus[m.id] = this;
							break;
						case "\u23f9":
							await bot.deleteMessage(m.channel.id, m.id);
							delete bot.menus[m.id];
							break;
					}
				}
			}
			message.addReaction("\u2b05");
			message.addReaction("\u27a1");
			message.addReaction("\u23f9");
		}
	},
	guildOnly: true,
	subcommands: {},
	alias: ["rl"]
}

module.exports.subcommands.create = {
	help: ()=> "Adds a new server-based color role (NOTE: will create a new role)",
	usage: ()=> [" [role name] [color] - Creates a role with the given name and color"],
	execute: async (bot, msg, args, config = {role_mode: 0}) => {
		if(config.role_mode == 0) return "Current mode set to user-based roles; can't add new server-based ones! Use `s!tg` to toggle modes";
		var color = bot.tc(args[args.length-1]);
		if(!color.isValid()) return "That is not a valid color";

		var role;

		try {
			role = await bot.createRole(msg.guild.id,{name: args.slice(0, args.length - 1).join(" "),color: parseInt(color.toHex(), 16)});
		} catch(e) {
			console.log(e.stack);
			return "Something went wrong while creating the role :(";
		}

		var success = await bot.utils.addServerRole(bot, msg.guild.id, role.id);
		if(success) return "Role created!";
		else return "Something went wrong while indexing the role :("

	},
	guildOnly: true,
	permissions: ["manageRoles"],
	alias: ['new', '+', 'cr', 'n', 'ind', 'index']
}

module.exports.subcommands.edit = {
	help: ()=> "Edit an indexed color role",
	usage: ()=> [" name [old name] (new line) [new name] - Changes a role's name. Put the new name on a new line!",
				 " color [name] [color] - Changes a role's color. This doesn't need a new line"],
	execute: async (bot, msg, args, config = {role_mode: 0}) => {
		if(config.role_mode == 0) return "Current mode set to user-based roles; can't edit server-based ones! Use `s!tg` to toggle modes";
		switch(args[0].toLowerCase()) {
			case "name":
				var newArgs = args.slice(1).join(" ").split("\n");
				var role = msg.guild.roles.find(r => r.name == newArgs[0]);
				if(!role) return "Role not found";
				try {
					await bot.editRole(msg.guild.id, role.id, {name: newArgs[1]})
				} catch(e) {
					console.log(e.stack);
					return "Something went wrong while updating the role :("
				}
				return "Updated!"
				break;
			case "color":
				var role = msg.guild.roles.find(r => r.name == args.slice(1, args.length-1).join(" "));
				if(!role) return "Role not found";
				var color = bot.tc(args[args.length-1]);
				if(!color.isValid()) return "Invalid color :("
				try {
					await bot.editRole(msg.guild.id, role.id, {color: parseInt(color.toHex(), 16)})
				} catch(e) {
					console.log(e.stack);
					return "Something went wrong while updating the role :("
				}
				return "Updated!"
				break;
		}
	},
	guildOnly: true,
	permissions: ['manageRoles']
}

module.exports.subcommands.reset = {
	help: ()=> "Deletes all server-based roles, setting the config back to user-based",
	usage: ()=> [" - Resets server-based roles"],
	execute: async (bot, msg, args) => {
		await msg.channel.createMessage("WARNING: This will delete all of your indexed server-based roles. Are you sure you want to continue? (y/n)");
		var messages = await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {maxMatches: 1, time: 10000});
		if(messages && messages[0]) {
			var conf = messages[0].content.toLowerCase();
			if(conf == "yes" || conf == "y") {
				var roles = await bot.utils.getServerRoles(bot, msg.guild);
				if(!roles) return "No roles to delete";
				await Promise.all(roles.map(async r => {
					await bot.deleteRole(msg.guild.id, r.id);
					return new Promise(res => setTimeout(()=> res(), 100));
				}))
				await bot.utils.updateConfig(bot, msg.guild.id, 0);
				await bot.utils.resetServerRoles(bot, msg.guild.id);
				return "Roles deleted!";
			} else {
				return "Action cancelled!";
			}
		}
	},
	guildOnly: true,
	permissions: ['manageRoles']
}