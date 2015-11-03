class ZeroBlog extends ZeroFrame
	init: ->
		@data = null
		@site_info = null
		@server_info = null
		@page = 1

		@event_page_load = $.Deferred()
		@event_site_info = $.Deferred()

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

		$.when(@event_site_info).done =>
			@log "event site info"
			# Set avatar
			imagedata = new Identicon(@site_info.address, 70).toString();
			$("body").append("<style>.avatar { background-image: url(data:image/png;base64,#{imagedata}) }</style>")

		@log "inited!"


	loadData: (query="new") ->
		# Get blog parameters
		if query == "old" # Old type query for pre 0.3.0
			query = "SELECT key, value FROM json LEFT JOIN keyvalue USING (json_id) WHERE path = 'data.json'"
		else
			query = "SELECT key, value FROM json LEFT JOIN keyvalue USING (json_id) WHERE directory = '' AND file_name = 'data.json'"
		@cmd "dbQuery", [query], (res) =>
			@data = {}
			if res
				for row in res
					@data[row.key] = row.value
				$(".left h1 a:not(.editable-edit)").html(@data.title).data("content", @data.title)
				$(".left h2").html(Text.toMarked(@data.description)).data("content", @data.description)
				$(".left .links").html(Text.toMarked(@data.links)).data("content", @data.links)


	loadLastcomments: (type="show", cb=false) ->
		query = "
			SELECT comment.*, json_content.json_id AS content_json_id, keyvalue.value AS cert_user_id, json.directory, post.title AS post_title
			FROM comment
			LEFT JOIN json USING (json_id)
			LEFT JOIN json AS json_content ON (json_content.directory = json.directory AND json_content.file_name='content.json')
			LEFT JOIN keyvalue ON (keyvalue.json_id = json_content.json_id AND key = 'cert_user_id')
			LEFT JOIN post ON (comment.post_id = post.post_id)
			WHERE post.title IS NOT NULL
			ORDER BY date_added DESC LIMIT 3"

		@cmd "dbQuery", [query], (res) =>
			if res.length
				$(".lastcomments").css("display", "block")
				res.reverse()
			for lastcomment in res
				elem = $("#lastcomment_#{lastcomment.json_id}_#{lastcomment.comment_id}")
				if elem.length == 0 # Not exits yet
					elem = $(".lastcomment.template").clone().removeClass("template").attr("id", "lastcomment_#{lastcomment.json_id}_#{lastcomment.comment_id}")
					if type != "noanim"
						elem.cssSlideDown()
					elem.prependTo(".lastcomments ul")
				@applyLastcommentdata(elem, lastcomment)
			if cb then cb()

	applyLastcommentdata: (elem, lastcomment) ->
		elem.find(".user_name").text(lastcomment.cert_user_id.replace(/@.*/, "")+":")

		body = Text.toMarked(lastcomment.body)
		body = body.replace /[\r\n]/g, " "  # Remove whitespace
		body = body.replace /\<blockquote\>.*?\<\/blockquote\>/g, " "  # Remove quotes
		body = body.replace /\<.*?\>/g, " "  # Remove html codes
		if body.length > 60  # Strip if too long
			body = body[0..60].replace(/(.*) .*?$/, "$1") + " ..."  # Keep the last 60 character and strip back until last space
		elem.find(".body").html(body)

		title_hash = lastcomment.post_title.replace(/[#?& ]/g, "+").replace(/[+]+/g, "+")
		elem.find(".postlink").text(lastcomment.post_title).attr("href", "?Post:#{lastcomment.post_id}:#{title_hash}#Comments")

	applyPagerdata: (page, limit, has_next) ->
		pager = $(".pager")
		console.log page, limit, has_next
		if page > 1
			pager.find(".prev").css("display", "inline-block").attr("href", "?page=#{page-1}")
		if has_next
			pager.find(".next").css("display", "inline-block").attr("href", "?page=#{page+1}")

	routeUrl: (url) ->
		@log "Routing url:", url
		if match = url.match /Post:([0-9]+)/
			$("body").addClass("page-post")
			@post_id = parseInt(match[1])
			@pagePost()
		else
			$("body").addClass("page-main")
			if match = url.match /page=([0-9]+)/
				@page = parseInt(match[1])
			@pageMain()

	# - Pages -

	pagePost: () ->
		s = (+ new Date)
		@cmd "dbQuery", ["SELECT * FROM post WHERE post_id = #{@post_id} LIMIT 1"], (res) =>
			if res.length
				@applyPostdata($(".post-full"), res[0], true)
				Comments.pagePost(@post_id)
			else
				$(".post-full").html("<h1>Not found</h1>")
			@pageLoaded()


	pageMain: ->
		limit = 15
		@cmd "dbQuery", ["SELECT post.*, COUNT(comment_id) AS comments FROM post LEFT JOIN comment USING (post_id) GROUP BY post_id ORDER BY date_published DESC LIMIT #{(@page-1)*limit}, #{limit+1}"], (res) =>
			s = (+ new Date)
			if res.length > limit # Has next page
				res.pop()
				@applyPagerdata(@page, limit, true)
			else
				@applyPagerdata(@page, limit, false)

			res.reverse()
			for post in res
				elem = $("#post_#{post.post_id}")
				if elem.length == 0 # Not exits yet
					elem = $(".post.template").clone().removeClass("template").attr("id", "post_#{post.post_id}")
					elem.prependTo(".posts")
				@applyPostdata(elem, post)
			@pageLoaded()
			@log "Posts loaded in", ((+ new Date)-s),"ms"

			$(".posts .new").on "click", => # Create new blog post
				@cmd "fileGet", ["data/data.json"], (res) =>
					data = JSON.parse(res)
					# Add to data
					data.post.unshift
						post_id: data.next_post_id
						title: "New blog post"
						date_published: (+ new Date)/1000
						body: "Blog post body"
					data.next_post_id += 1

					# Create html elements
					elem = $(".post.template").clone().removeClass("template")
					@applyPostdata(elem, data.post[0])
					elem.hide()
					elem.prependTo(".posts").slideDown()
					@addInlineEditors(elem)

					@writeData(data)
				return false


	# - EOF Pages -


	# All page content loaded
	pageLoaded: =>
		$("body").addClass("loaded") # Back/forward button keep position support
		$('pre code').each (i, block) -> # Higlight code blocks
			hljs.highlightBlock(block)
		@event_page_load.resolve()
		@cmd "innerLoaded", true


	addInlineEditors: (parent) ->
		@logStart "Adding inline editors"
		elems = $("[data-editable]:visible", parent)
		for elem in elems
			elem = $(elem)
			if not elem.data("editor") and not elem.hasClass("editor")
				editor = new InlineEditor(elem, @getContent, @saveContent, @getObject)
				elem.data("editor", editor)
		@logEnd "Adding inline editors"


	# Check if publishing is necessary
	checkPublishbar: ->
		if not @data["modified"] or @data["modified"] > @site_info.content.modified
			$(".publishbar").addClass("visible")
		else
			$(".publishbar").removeClass("visible")


	# Sign and Publish site
	publish: =>
		if @site_info.privatekey # Privatekey stored in users.json
			@cmd "sitePublish", ["stored"], (res) =>
				@log "Publish result:", res
		else
			@cmd "wrapperPrompt", ["Enter your private key:", "password"], (privatekey) => # Prompt the private key
				$(".publishbar .button").addClass("loading")
				@cmd "sitePublish", [privatekey], (res) =>
					$(".publishbar .button").removeClass("loading")
					@log "Publish result:", res

		return false # Ignore link default event


	# Apply from data to post html element
	applyPostdata: (elem, post, full=false) ->
		title_hash = post.title.replace(/[#?& ]/g, "+").replace(/[+]+/g, "+")
		elem.data("object", "Post:"+post.post_id)
		$(".title .editable", elem).html(post.title).attr("href", "?Post:#{post.post_id}:#{title_hash}").data("content", post.title)
		date_published = Time.since(post.date_published)
		# Published date
		if post.body.match /^---/m # Has more over fold
			date_published += " &middot; #{Time.readtime(post.body)}" # If has break add readtime
			$(".more", elem).css("display", "inline-block").attr("href", "?Post:#{post.post_id}:#{title_hash}")
		$(".details .published", elem).html(date_published).data("content", post.date_published)
		# Comments num
		if post.comments > 0
			$(".details .comments-num", elem).css("display", "inline").attr("href", "?Post:#{post.post_id}:#{title_hash}#Comments")
			$(".details .comments-num .num", elem).text("#{post.comments} comments")
		else
			$(".details .comments-num", elem).css("display", "none")

		if full
			body = post.body
		else # On main page only show post until the first --- hr separator
			body = post.body.replace(/^([\s\S]*?)\n---\n[\s\S]*$/, "$1")

		$(".body", elem).html(Text.toMarked(body)).data("content", post.body)


	# Wrapper websocket connection ready
	onOpenWebsocket: (e) =>
		@loadData()
		@routeUrl(window.location.search.substring(1))
		@cmd "siteInfo", {}, @setSiteinfo
		@cmd "serverInfo", {}, (ret) => # Get server info
			@server_info = ret
			if @server_info.rev < 160
				@loadData("old")
		@loadLastcomments("noanim")


	# Returns the elem parent object
	getObject: (elem) =>
		return elem.parents("[data-object]:first")


	# Get content from data.json
	getContent: (elem, raw=false) =>
		[type, id] = @getObject(elem).data("object").split(":")
		id = parseInt(id)
		content = elem.data("content")
		if elem.data("editable-mode") == "timestamp" # Convert to time
			content = Time.date(content, "full")

		if elem.data("editable-mode") == "simple" or raw # No markdown
			return content
		else
			return Text.toMarked(content)


	# Save content to data.json
	saveContent: (elem, content, cb=false) =>
		if elem.data("deletable") and content == null then return @deleteObject(elem, cb) # Its a delete request
		elem.data("content", content)
		[type, id] = @getObject(elem).data("object").split(":")
		id = parseInt(id)
		if type == "Post" or type == "Site"
			@saveSite(elem, type, id, content, cb)
		else if type == "Comment"
			@saveComment(elem, type, id, content, cb)



	saveSite: (elem, type, id, content, cb) ->
		@cmd "fileGet", ["data/data.json"], (res) =>
			data = JSON.parse(res)
			if type == "Post"
				post = (post for post in data.post when post.post_id == id)[0]

				if elem.data("editable-mode") == "timestamp" # Time parse to timestamp
					content = Time.timestamp(content)

				post[elem.data("editable")] = content
			else if type == "Site"
				data[elem.data("editable")] = content

			@writeData data, (res) =>
				if cb
					if res == true # OK
						if elem.data("editable-mode") == "simple" # No markdown
							cb(content)
						else if elem.data("editable-mode") == "timestamp" # Format timestamp
							cb(Time.since(content))
						else
							cb(Text.toMarked(content))
					else # Error
						cb(false)



	saveComment: (elem, type, id, content, cb) ->
		@log "Saving comment...", id
		@getObject(elem).css "height", "auto"
		inner_path = "data/users/#{Page.site_info.auth_address}/data.json"
		Page.cmd "fileGet", {"inner_path": inner_path, "required": false}, (data) =>
			data = JSON.parse(data)
			comment = (comment for comment in data.comment when comment.comment_id == id)[0]
			comment[elem.data("editable")] = content
			json_raw = unescape(encodeURIComponent(JSON.stringify(data, undefined, '\t')))
			@writePublish inner_path, btoa(json_raw), (res) =>
				if res == true
					Comments.checkCert("updaterules")
					if cb then cb(Text.toMarked(content, {"sanitize": true}))
				else
					@cmd "wrapperNotification", ["error", "File write error: #{res}"]
					if cb then cb(false)




	deleteObject: (elem, cb=False) ->
		[type, id] = elem.data("object").split(":")
		id = parseInt(id)

		if type == "Post"
			@cmd "fileGet", ["data/data.json"], (res) =>
				data = JSON.parse(res)
				if type == "Post"
					post = (post for post in data.post when post.post_id == id)[0]
					if not post then return false # No post found for this id
					data.post.splice(data.post.indexOf(post), 1) # Remove from data

					@writeData data, (res) =>
						if cb then cb()
						if res == true then elem.slideUp()
		else if type == "Comment"
			inner_path = "data/users/#{Page.site_info.auth_address}/data.json"
			@cmd "fileGet", {"inner_path": inner_path, "required": false}, (data) =>
				data = JSON.parse(data)
				comment = (comment for comment in data.comment when comment.comment_id == id)[0]
				data.comment.splice(data.comment.indexOf(comment), 1)
				json_raw = unescape(encodeURIComponent(JSON.stringify(data, undefined, '\t')))
				@writePublish inner_path, btoa(json_raw), (res) =>
					if res == true
						elem.slideUp()
					if cb then cb()



	writeData: (data, cb=null) ->
		if not data
			return @log "Data missing"
		@data["modified"] = data.modified = Time.timestamp()
		json_raw = unescape(encodeURIComponent(JSON.stringify(data, undefined, '\t'))) # Encode to json, encode utf8
		@cmd "fileWrite", ["data/data.json", btoa(json_raw)], (res) => # Convert to to base64 and send
			if res == "ok"
				if cb then cb(true)
			else
				@cmd "wrapperNotification", ["error", "File write error: #{res}"]
				if cb then cb(false)
			@checkPublishbar()

		# Updating title in content.json
		@cmd "fileGet", ["content.json"], (content) =>
			content = content.replace /"title": ".*?"/, "\"title\": \"#{data.title}\"" # Load as raw html to prevent js bignumber problems
			@cmd "fileWrite", ["content.json", btoa(content)], (res) =>
				if res != "ok"
					@cmd "wrapperNotification", ["error", "Content.json write error: #{res}"]

				# If the privatekey is stored sign the new content
				if @site_info["privatekey"]
					@cmd "siteSign", ["stored", "content.json"], (res) =>
						@log "Sign result", res


	writePublish: (inner_path, data, cb) ->
		@cmd "fileWrite", [inner_path, data], (res) =>
			if res != "ok" # fileWrite failed
				@cmd "wrapperNotification", ["error", "File write error: #{res}"]
				cb(false)
				return false

			@cmd "sitePublish", {"inner_path": inner_path}, (res) =>
				if res == "ok"
					cb(true)
				else
					cb(res)



	# Parse incoming requests
	onRequest: (cmd, message) ->
		if cmd == "setSiteInfo" # Site updated
			@actionSetSiteInfo(message)
		else
			@log "Unknown command", message


	# Siteinfo changed
	actionSetSiteInfo: (message) =>
		@setSiteinfo(message.params)
		@checkPublishbar()


	setSiteinfo: (site_info) =>
		@site_info = site_info
		@event_site_info.resolve(site_info)
		if $("body").hasClass("page-post") then Comments.checkCert() # Update if username changed
		# User commented
		if site_info.event?[0] == "file_done" and site_info.event[1].match /.*users.*data.json$/
			if $("body").hasClass("page-post")
				Comments.loadComments() # Post page, reload comments
				@loadLastcomments()
			if $("body").hasClass("page-main")
				RateLimit 500, =>
					@pageMain()
					@loadLastcomments()
		else if site_info.event?[0] == "file_done" and site_info.event[1] == "data/data.json"
			@loadData()
			if $("body").hasClass("page-main") then @pageMain()
			if $("body").hasClass("page-post") then @pagePost()


window.Page = new ZeroBlog()
