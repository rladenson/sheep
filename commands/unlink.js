module.exports = {
	help: ()=> "Unlink your color role from another user",
	usage: ()=> [" [user] - Unlinks your color role from another user, allowing you to have an individual color again"],
	desc: ()=> ["The user can be a @mention, user ID, or username#1234. ",
				"After unlinking, you'll have to set your color again- they keep the role, not you."].join(""),
	execute: async (bot, msg, args, config = {role_mode: 0}) => {
		if(config.role_mode == 1) return "Can't unlink colors in server-based color mode!";

		var user = msg.guild.members.find(m => {
			return m.id == args[0].replace(/[<@!>]/g,"") ||
				`${m.username}#${m.discriminator}`.toLowerCase() ==
					args.join(" ").toLowerCase()
		});
		if(!user) return "Couldn't find that user :(";
		var role = await bot.utils.getUserRole(bot, msg.guild, msg.author.id);
		if(!role) return "You don't have a role to unlink!";
		var role2 = await bot.utils.getRawUserRole(bot, msg.guild, user.id);
		if(role != role2.id) return "Your roles aren't linked!";

		try {
			await msg.member.removeRole(role);
		} catch(e) {
			console.log(e);
			return "ERR: "+e.message;
		}
		var scc = await bot.utils.unlinkUserRole(bot, msg.guild.id, role, msg.author.id);
		if(scc) return "Roles unlinked!";
		else return "Something went wrong D:"
	},
	guildOnly: true,
	alias: ["share"]
}