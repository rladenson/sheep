const axios = require('axios');
const { confBtns } = require('../../extras');
const tc = require('tinycolor2');

module.exports = {
	data: {
		name: 'pkimport',
		description: "Import member colors from PluralKit",
		options: [{
			name: 'id',
			description: "The id of a PK member",
			type: 3,
			required: true
        }]
	},
	usage: [
		'[id] - Imports the color of a specified PluralKit member to saved colors list'
	],
	async execute(ctx) {
		var id = ctx.options.getString('id').trim().toLowerCase();

		try {
            var req = await axios.get('https://api.pluralkit.me/v2/members/' + id);
			var data = req.data;
			if(!data || typeof data != 'object')
                return "The PK API may be down, please try again later.";

            if (!data.color)
                return `The member with id ${data.id} does not have a color set.`

            var name = data.name;
            var color = data.color;

            var conf;
            var exists = await ctx.client.stores.colors.get(ctx.user.id, name.toLowerCase());
            if (exists) {
                var m = await ctx.reply({
                    content: `Color with the name "${name}"already saved! Do you want to override it?`,
                    components: [{ type: 1, components: confBtns }],
                    fetchReply: true
                });
                conf = await ctx.client.utils.getConfirmation(ctx.client, m, ctx.user);
                if (conf.msg) {
                    if (conf.interaction) await conf.interaction.update({
                        content: conf.msg,
                        components: []
                    });
                    else await ctx.editReply({
                        content: conf.msg,
                        components: []
                    });
                    return;
                }
            }

            color = tc(color);
            if (!color.isValid()) return "That color isn't valid!";
            color = color.toHex();

            if (exists) await ctx.client.stores.colors.update(ctx.user.id, name, { color: color });
            else await ctx.client.stores.colors.create(ctx.user.id, name, { color });

            if (conf ?.interaction) await conf.interaction.update({
                content: 'Color saved!',
                components: []
            });
            else await ctx[ctx.replied ? "editReply" : "reply"]({
                content: 'Color saved!',
                components: []
            });

            return;

		} catch(e) {
			await ctx[ctx.replied ? "followUp" : "reply"]({
				content: "ERR: " + (e.message ?? e),
				ephemeral: true
			})
		}

		return;
	}
}