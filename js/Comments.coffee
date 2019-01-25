class Comments extends Class
	pagePost: (post_id, cb=false) ->
		@post_id = post_id
		@rules = {}
		$(".button-submit-comment").off("click").on "click", =>
			@submitComment()
			return false
		@loadComments("noanim", cb)
		@autoExpand $(".comment-textarea")

		$(".certselect").off("click").on "click", =>
			if Page.server_info.rev < 160
				Page.cmd "wrapperNotification", ["error", "Comments requires at least ZeroNet 0.3.0 Please upgade!"]
			else
				Page.cmd "certSelect", [["zeroid.bit"]]
			return false


	loadComments: (type="show", cb=false) ->
		query = "SELECT comment.*, json_content.json_id AS content_json_id, keyvalue.value AS cert_user_id, json.directory,
			(SELECT COUNT(*) FROM comment_vote WHERE comment_vote.comment_uri = comment.comment_id || '@' || json.directory)+1 AS votes
			FROM comment
			LEFT JOIN json USING (json_id)
			LEFT JOIN json AS json_content ON (json_content.directory = json.directory AND json_content.file_name='content.json')
			LEFT JOIN keyvalue ON (keyvalue.json_id = json_content.json_id AND key = 'cert_user_id')
			WHERE post_id = #{@post_id} ORDER BY date_added DESC"

		Page.cmd "dbQuery", query, (comments) =>
			$("#Comments_header").text(comments.length + if comments.length > 1 then " Comments:" else " Comment:")
			for comment in comments
				user_address = comment.directory.replace("users/", "")
				comment_address = "#{comment.comment_id}_#{user_address}"
				elem = $("#comment_"+comment_address)
				if elem.length == 0 # Create if not exits
					elem = $(".comment.template").clone().removeClass("template").attr("id", "comment_"+comment_address).data("post_id", @post_id)
					if type != "noanim"
						elem.cssSlideDown()
					$(".reply", elem).off("click").on "click", (e) => # Reply link
						return @buttonReply $(e.target).parents(".comment")
				@applyCommentData(elem, comment)
				elem.appendTo(".comments")
			setTimeout (->
				Page.addInlineEditors(".comments")
			), 1000


	applyCommentData: (elem, comment) ->
		[user_name, cert_domain] = comment.cert_user_id.split("@")
		user_address = comment.directory.replace("users/", "")
		$(".comment-body", elem).html Text.renderMarked(comment.body, {"sanitize": true})
		$(".user_name", elem).text(user_name).css("color": Text.toColor(comment.cert_user_id)).attr("title", "#{user_name}@#{cert_domain}: #{user_address}")
		$(".added", elem).text(Time.since(comment.date_added)).attr("title", Time.date(comment.date_added, "long"))
		#$(".cert_domain", elem).html("@#{cert_domain}").css("display", "none")
		# Add inline editor
		if user_address == Page.site_info.auth_address
			$(elem).attr("data-object", "Comment:#{comment.comment_id}").attr("data-deletable", "yes")
			$(".comment-body", elem).attr("data-editable", "body").data("content", comment.body)


	buttonReply: (elem) ->
		@log "Reply to", elem
		user_name = $(".user_name", elem).text()
		post_id = elem.attr("id")
		body_add = "> [#{user_name}](\##{post_id}): "
		elem_quote = $(".comment-body", elem).clone()
		$("blockquote", elem_quote).remove() # Remove other people's quotes
		body_add+= elem_quote.text().trim("\n").replace(/\n/g, "\n> ")
		body_add+= "\n\n"
		$(".comment-new .comment-textarea").val( $(".comment-new .comment-textarea").val()+body_add )
		$(".comment-new .comment-textarea").trigger("input").focus() # Autosize
		return false


	submitComment: ->
		if not Page.site_info.cert_user_id # Not registered
			Page.cmd "wrapperNotification", ["info", "Please, select your account."]
			return false

		body = $(".comment-new .comment-textarea").val()
		if not body
			$(".comment-new .comment-textarea").focus()
			return false

		$(".comment-new .button-submit").addClass("loading")
		inner_path = "data/users/#{Page.site_info.auth_address}/data.json"
		Page.cmd "fileGet", {"inner_path": inner_path, "required": false}, (data) =>
			if data
				data = JSON.parse(data)
			else # Default data
				data = {"next_comment_id": 1, "comment": [], "comment_vote": {}, "topic_vote": {} }

			data.comment.push {
				"comment_id": data.next_comment_id,
				"body": body,
				"post_id": @post_id,
				"date_added": Time.timestamp()
			}
			data.next_comment_id += 1
			json_raw = unescape(encodeURIComponent(JSON.stringify(data, undefined, '\t')))
			Page.writePublish inner_path, btoa(json_raw), (res) =>
				$(".comment-new .button-submit").removeClass("loading")
				@loadComments()
				setTimeout (->
					Page.loadLastcomments()
				), 1000
				@checkCert("updaterules")
				@log "Writepublish result", res
				if res != false
					$(".comment-new .comment-textarea").val("")


	checkCert: (type) ->
		last_cert_user_id = $(".comment-new .user_name").text()
		if Page.site_info.cert_user_id
			$(".comment-new").removeClass("comment-nocert")
			$(".comment-new .user_name").text(Page.site_info.cert_user_id)
		else
			$(".comment-new").addClass("comment-nocert")
			$(".comment-new .user_name").text("Please sign in")

		if $(".comment-new .user_name").text() != last_cert_user_id or type == "updaterules" # User changed
			# Update used/allowed space
			if Page.site_info.cert_user_id
				Page.cmd "fileRules", "data/users/#{Page.site_info.auth_address}/content.json", (rules) =>
					@rules = rules
					if rules.max_size
						@setCurrentSize(rules.current_size)
					else
						@setCurrentSize(0)
			else
				@setCurrentSize(0)


	setCurrentSize: (current_size) ->
		if current_size
			current_size_kb = current_size/1000
			$(".user-size").text("used: #{current_size_kb.toFixed(1)}k/#{Math.round(@rules.max_size/1000)}k")
			$(".user-size-used").css("width", Math.round(70*current_size/@rules.max_size))
		else
			$(".user-size").text("")


	autoExpand: (elem) ->
		editor = elem[0]
		# Autoexpand
		if elem.height() > 0 then elem.height(1)

		elem.off("input").on "input", =>
			if editor.scrollHeight > elem.height()
				old_height = elem.height()
				elem.height(1)
				new_height = editor.scrollHeight
				new_height += parseFloat elem.css("borderTopWidth")
				new_height += parseFloat elem.css("borderBottomWidth")
				new_height -= parseFloat elem.css("paddingTop")
				new_height -= parseFloat elem.css("paddingBottom")

				min_height = parseFloat(elem.css("lineHeight"))*2 # 2 line minimum
				if new_height < min_height then new_height = min_height+4

				elem.height(new_height-4)
			# Update used space
			if @rules.max_size
				if elem.val().length > 0
					current_size = @rules.current_size + elem.val().length + 90
				else
					current_size = @rules.current_size
				@setCurrentSize(current_size)
		if elem.height() > 0 then elem.trigger "input"
		else elem.height("48px")


window.Comments = new Comments()
