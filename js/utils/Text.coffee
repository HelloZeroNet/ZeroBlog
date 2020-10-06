class Renderer extends marked.Renderer
	image: (href, title, text) ->
		return ("<code>![#{text}](#{href})</code>")

class Text
	toColor: (text) ->
		hash = 0
		for i in [0..text.length-1]
			hash = text.charCodeAt(i) + ((hash << 5) - hash)
		color = '#'
		if Page.server_info?.user_settings?.theme == "dark"
			return "hsl(" + (hash % 360) + ",80%,70%)"
		else
			return "hsl(" + (hash % 360) + ",30%,50%)"


	renderMarked: (text, options={}) ->
		options["gfm"] = true
		options["breaks"] = true
		if options.sanitize
			options["renderer"] = renderer # Dont allow images
		text = text.replace(/((?<=\s|^)http[s]?:\/\/.*?)(?=\s|$)/g, '<$1>')  # Auto linkify IPv6 urls by adding <> around urls
		text = marked(text, options)
		text = text.replace(/(https?:\/\/)%5B(.*?)%5D/g, '$1[$2]')  # Fix IPv6 links
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
