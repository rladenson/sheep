const axios = require('axios');
const { confBtns } = require('../../extras');

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
		var id = ctx.options.getString('id');

		try {
            var req = await axios.get('https://api.pluralkit.me/v2/members/' + id);
			var data = req.data;
			if(!data || typeof data != 'object')
                return "The PK API may be down, please try again later.";

            return "Successful call";

		} catch(e) {
			await ctx[ctx.replied ? "followUp" : "reply"]({
				content: "ERR: " + (e.message ?? e),
				ephemeral: true
			})
		}

		return;
	}
}