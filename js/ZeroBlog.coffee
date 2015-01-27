class ZeroBlog extends ZeroFrame
	init: ->
		# Set avatar
		address = document.location.href.match(/media\/(.*?)\//)[1]
		imagedata = new Identicon(address, 70).toString();
		$("body").append("<style>.avatar { background-image: url(data:image/png;base64,#{imagedata}) }</style>")

		@data = null
		@site_info = null
		@server_info = null

		@event_page_load = $.Deferred()
		@event_site_info = $.Deferred()
		@loadData()

		# Editable items on own site
		$.when(@event_page_load, @event_site_info).done =>
			if @site_info.settings.own or @data.demo
				@addInlineEditors()
				@checkPublishbar()
				$(".publishbar").on "click", @publish
				$(".posts .button.new").css("display", "inline-block")
				$(".editbar .icon-help").on "click", =>
					$(".editbar .markdown-help").css("display", "block")
					$(".editbar .markdown-help").toggleClassLater("visible", 10)
					$(".editbar .icon-help").toggleClass("active")
					return false

		@log "inited!"


	loadData: ->
		$.get "#{window.media_root}/data.json", (data) =>
			@data = data
			$(".left h1 a").html(data.title)
			$(".left h2").html(marked(data.description))
			$(".left .links").html(marked(data.links))

			# Show page based on url
			@routeUrl(window.location.search.substring(1))


	routeUrl: (url) ->
		@log "Routing url:", url
		if match = url.match /Post:([0-9]+)/
			$("body").addClass("page-post")
			@pagePost(parseInt(match[1]))
		else
			$("body").addClass("page-main")
			@pageMain()


	# - Pages -


	pagePost: (post_id) ->
		s = (+ new Date)
		found = false
		for post in @data.posts
			if post.id == post_id
				found = true
				break

		if found
			@applyPostdata($(".post-full"), post, true)
		else
			$(".post-full").html("<h1>Not found</h1>")
		@pageLoaded()
		@log "Post loaded in", ((+ new Date)-s),"ms"



	pageMain: ->
		s = (+ new Date)
		for post in @data.posts
			elem = $(".post.template").clone().removeClass("template")
			@applyPostdata(elem, post)
			elem.appendTo(".posts")
		@pageLoaded()
		@log "Posts loaded in", ((+ new Date)-s),"ms"

		$(".posts .new").on "click", => # Create new blog post
			# Add to data
			@data.posts.unshift
				id: @data.next_id
				title: "New blog post"
				posted: (+ new Date)/1000
				edited: false
				body: "Blog post body"
			@data.next_id += 1

			# Create html elements
			elem = $(".post.template").clone().removeClass("template")
			@applyPostdata(elem, @data.posts[0])
			elem.hide()
			elem.prependTo(".posts").slideDown()
			@addInlineEditors(elem)

			@writeData()
			return false



	# - EOF Pages -


	# All page content loaded
	pageLoaded: ->
		$("body").addClass("loaded") # Back/forward button keep position support
		$('pre code').each (i, block) -> # Higlight code blocks
			hljs.highlightBlock(block)
		@event_page_load.resolve()


	# Add inline editor markers
	addInlineEditors: (parent) ->
		elems = $("[data-editable]:visible", parent)
		for elem in elems
			new InlineEditor($(elem), @getContent, @saveContent, @getObject)


	# Check if publishing is necessary
	checkPublishbar: ->
		if not @data.modified or @data.modified > @site_info.content.modified
			$(".publishbar").addClass("visible")
		else
			$(".publishbar").removeClass("visible")


	# Sign and Publish site
	publish: =>
		if not @server_info.ip_external # No port open
			@cmd "wrapperNotification", ["error", "To publish the site please open port <b>#{@server_info.fileserver_port}</b> on your router"]
			return false
		@cmd "wrapperPrompt", ["Enter your private key:", "password"], (privatekey) => # Prompt the private key
			$(".publishbar .button").addClass("loading")
			@cmd "sitePublish", [privatekey], (res) =>
				$(".publishbar .button").removeClass("loading")
				@log "Publish result:", res

		return false # Ignore link default event


	# Apply from data to post html element
	applyPostdata: (elem, post, full=false) ->
		title_hash = post.title.replace(/[#?& ]/g, "+").replace(/[+]+/g, "+")
		elem.data("object", "Post:"+post.id)
		$(".title a", elem).html(post.title).attr("href", "?Post:#{post.id}:#{title_hash}")
		details = @formatSince(post.posted)

		if post.body.match /^---/m # Has more over fold
			details += " &middot; #{@readtime(post.body)}" # If has break add readtime
			$(".more", elem).css("display", "inline-block").attr("href", "?Post:#{post.id}:#{title_hash}")
		$(".details", elem).html(details)

		if full 
			body = post.body
		else # On main page only show post until the first --- hr separator
			body = post.body.replace(/^([\s\S]*?)\n---\n[\s\S]*$/, "$1")

		$(".body", elem).html(marked(body))


	# Wrapper websocket connection ready
	onOpenWebsocket: (e) =>
		@cmd "siteInfo", {}, @setSiteinfo
		@cmd "serverInfo", {}, (ret) => # Get server info
			@server_info = ret
			version = @server_info.version.split(".")
			if version[0] == "0" and version[1] == "1" and parseInt(version[2]) < 6
				@cmd "wrapperNotification", ["error", "ZeroBlog requires ZeroNet 0.1.6, please update!"]


	# Returns the elem parent object
	getObject: (elem) =>
		return elem.parents("[data-object]")


	# Get content from data.json
	getContent: (elem, raw=false) =>
		[type, id] = @getObject(elem).data("object").split(":")
		id = parseInt(id)
		if type == "Post"
			post = (post for post in @data.posts when post.id == id)[0]
			content = post[elem.data("editable")]

			if elem.data("editable-mode") == "timestamp" # Time hash
				content = @formatDate(content, "full")
		else if type == "Site"
			content = @data[elem.data("editable")]
		else
			content = "Unknown"


		if elem.data("editable-mode") == "simple" or raw # No markdown
			return content
		else
			return marked(content)


	# Save content to data.json
	saveContent: (elem, content, cb=false) =>
		if elem.data("deletable") and content == null then return @deleteObject(elem) # Its a delete request

		[type, id] = @getObject(elem).data("object").split(":")
		id = parseInt(id)

		if type == "Post"
			post = (post for post in @data.posts when post.id == id)[0]

			if elem.data("editable-mode") == "timestamp" # Time parse to timestamp
				content = @timestamp(content)

			post[elem.data("editable")] = content
		else if type == "Site"
			@data[elem.data("editable")] = content

		@writeData (res) =>
			if cb
				if res == true # OK
					if elem.data("editable-mode") == "simple" # No markdown
						cb(content)
					else if elem.data("editable-mode") == "timestamp" # Format timestamp
						cb(@formatSince(content))
					else
						cb(marked(content))
				else # Error
					cb(false)


	deleteObject: (elem) ->
		[type, id] = elem.data("object").split(":")
		id = parseInt(id)

		if type == "Post"
			post = (post for post in @data.posts when post.id == id)[0]
			if not post then return false # No post found for this id
			@data.posts.splice(@data.posts.indexOf(post), 1) # Remove from data

			@writeData (res) ->
				if res == true then window.open("?Home", "_top") # Go to home


	writeData: (cb=null) ->
		@data.modified = @timestamp()
		json_raw = unescape(encodeURIComponent(JSON.stringify(@data, undefined, '\t'))) # Encode to json, encode utf8
		@cmd "fileWrite", ["data.json", btoa(json_raw)], (res) => # Convert to to base64 and send
			if res == "ok"
				if cb then cb(true)
			else
				@cmd "wrapperNotification", ["error", "File write error: #{res}"]
				if cb then cb(false)
			@checkPublishbar()

		# Updating title in content.json
		$.get "content.json", ((content) =>
			content = content.replace /"title": ".*?"/, "\"title\": \"#{@data.title}\"" # Load as raw html to prevent js bignumber problems
			@cmd "fileWrite", ["content.json", btoa(content)], (res) =>
				if res != "ok"
					@cmd "wrapperNotification", ["error", "Content.json write error: #{res}"]
		), "html"


	# - Date -

	formatSince: (time) ->
		now = +(new Date)/1000
		secs = now - time
		if secs < 60
			back = "Just now"
		else if secs < 60*60
			back = "#{Math.round(secs/60)} minutes ago"
		else if secs < 60*60*24
			back = "#{Math.round(secs/60/60)} hours ago"
		else if secs < 60*60*24*3
			back = "#{Math.round(secs/60/60/24)} days ago"
		else
			back = "on "+@formatDate(time)
		back = back.replace(/1 ([a-z]+)s/, "1 $1") # 1 days ago fix
		return back


	# Get elistamated read time for post
	readtime: (text) ->
		chars = text.length
		if chars > 1500
			return parseInt(chars/1500)+" min read"
		else
			return "less than 1 min read"


	formatDate: (timestamp, format="short") ->
		parts = (new Date(timestamp*1000)).toString().split(" ")
		if format == "short"
			display = parts.slice(1, 4)
		else
			display = parts.slice(1, 5)
		return display.join(" ").replace(/( [0-9]{4})/, ",$1")


	timestamp: (date="") ->
		if date == "now" or date == ""
			return parseInt(+(new Date)/1000)
		else
			return parseInt(Date.parse(date)/1000)


	# Route incoming requests
	route: (cmd, message) ->
		if cmd == "setSiteInfo" # Site updated
			@actionSetSiteInfo(message)
		else
			@log "Unknown command", message


	# Siteinfo changed
	actionSetSiteInfo: (message) =>
		@log "setSiteinfo", message
		@setSiteinfo(message.params)
		@checkPublishbar()


	setSiteinfo: (site_info) =>
		@site_info = site_info
		@event_site_info.resolve(site_info)


window.zero_blog = new ZeroBlog()
