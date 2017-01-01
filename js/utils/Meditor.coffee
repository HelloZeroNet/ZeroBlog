class Meditor extends Class
	constructor: (@tag_original, body) ->
		@log "Create", @

		@tag_original.insertAdjacentHTML('beforeBegin', "<div class='meditor'></div>")
		@tag_container = @tag_original.previousSibling

		@tag_container.insertAdjacentHTML('afterBegin', @tag_original.outerHTML)
		@tag_original.style.display = "none"
		@tag = @tag_container.firstChild

		if body
			@tag.innerHTML = marked(body, {gfm: true, breaks: true})
		@


	load: =>
		if not window.AlloyEditor
			style = document.createElement("link")
			style.href = "alloy-editor/all.css"
			style.rel = "stylesheet"
			document.head.appendChild(style)

			script = document.createElement("script")
			script.src = "alloy-editor/all.js"
			document.head.appendChild(script)

			script.onload = @handleEditorLoad
		else
			@handleEditorLoad()


	handleEditorLoad: =>
		# Create ckeditor<>markdown edit mode switch button
		@tag.insertAdjacentHTML('beforeBegin', "<a href='#Markdown' class='meditor-editmode' title='Switch to markdown'>&lt;/&gt;</a>")
		@tag_editmode = @tag.previousSibling
		@tag_editmode.onclick = @handleEditmodeChange

		# Create ckeditor
		@editor = new CustomAlloyEditor(@tag)
		if @handleImageSave then @editor.handleImageSave = @handleImageSave

		# Create markdown editor textfield
		@tag.insertAdjacentHTML('beforeBegin', @tag_original.outerHTML)
		@tag_markdown = @tag.previousSibling
		@tag_markdown.innerHTML = "<textarea class='meditor-markdown'>MARKDOWN</textarea>"
		@autoHeight(@tag_markdown.firstChild)
		@tag_markdown.firstChild.oninput = =>
			@autoHeight(@tag_markdown.firstChild)

		@tag_markdown.style.display = "none"

		# Call onLoad for external scripts
		setTimeout ( =>
			@onLoad?()
		), 1


	autoHeight: (elem) ->
		height_before = elem.style.height
		if height_before
			elem.style.height = "0px"
		h = elem.offsetHeight
		scrollh = elem.scrollHeight
		elem.style.height = height_before
		if scrollh > h
			elem.style.height = scrollh+"px"
			elem.style.scrollTop = "0px"
		else
			elem.style.height = height_before


	getMarkdown: ->
		if @tag_editmode.classList.contains("markdown")
			back = @tag_markdown.firstChild.value
		else
			back = toMarkdown(@tag.innerHTML, {gfm: true})
		return back


	getHtml: ->
		if @tag_editmode.classList.contains("markdown")
			back = marked(@tag_markdown.firstChild.value, {gfm: true, breaks: true})
		else
			back = marked(@getMarkdown(), {gfm: true, breaks: true})

	handleEditmodeChange: =>
		if @tag_editmode.classList.contains("markdown")
			# Change to ckeditor
			@tag_markdown.style.display = "none"
			@tag.style.display = ""
			@tag.innerHTML = @getHtml()
		else
			# Change to markdown
			@tag_markdown.style.display = ""
			@tag_markdown.style.width = @tag.offsetWidth+"px"
			@tag.style.display = "none"
			@tag_markdown.firstChild.value = @getMarkdown()
			@autoHeight(@tag_markdown.firstChild)
		@tag_editmode.classList.toggle("markdown")

		return false


	save: =>
		@tag_original.innerHTML = @getHtml()


	remove: =>
		@tag_editmode.remove()
		@tag_markdown.remove()
		@tag_original.style.display = ""
		@tag.remove()

	val: =>
		return @getMarkdown()

window.Meditor = Meditor