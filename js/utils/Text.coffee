class Renderer extends marked.Renderer
	image: (href, title, text) ->
		return ("<code>![#{text}](#{href})</code>")

class Text
	toColor: (text) ->
		hash = 0
		for i in [0..text.length-1]
			hash = text.charCodeAt(i) + ((hash << 5) - hash)
		color = '#'
		return "hsl(" + (hash % 360) + ",30%,50%)";
		for i in [0..2]
			value = (hash >> (i * 8)) & 0xFF
			color += ('00' + value.toString(16)).substr(-2)
		return color


	renderMarked: (text, options={}) ->
		options["gfm"] = true
		options["breaks"] = true
		if options.sanitize
			options["renderer"] = renderer # Dont allow images
		text = marked(text, options)
		return @fixHtmlLinks text


	# Convert zeronet html links to relaitve
	fixHtmlLinks: (text) ->
		if window.is_proxy
			return text.replace(/href="http:\/\/(127.0.0.1|localhost):43110/g, 'href="http://zero')
		else
			return text.replace(/href="http:\/\/(127.0.0.1|localhost):43110/g, 'href="')


	# Convert a single link to relative
	fixLink: (link) ->
		if window.is_proxy
			return link.replace(/http:\/\/(127.0.0.1|localhost):43110/, 'http://zero')
		else
			return link.replace(/http:\/\/(127.0.0.1|localhost):43110/, '')


	toUrl: (text) =>
		return text.replace(/[^A-Za-z0-9]/g, "+").replace(/[+]+/g, "+").replace(/[+]+$/, "")

window.is_proxy = (window.location.pathname == "/")
window.renderer = new Renderer()
window.Text = new Text()
