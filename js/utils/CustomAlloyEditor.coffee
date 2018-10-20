class CustomAlloyEditor extends Class
	constructor: (@tag) ->
		editor = AlloyEditor.editable(@tag)

		# Add top padding to avoid toolbar movement
		el = editor._editor.element.$
		height_before = el.getClientRects()[0].height
		style = getComputedStyle(el)
		el.style.position = "relative"
		el.style.paddingTop = (parseInt(style["padding-top"]) + 20) + "px"
		height_added = el.getClientRects()[0].height - height_before
		el.style.top = (parseInt(style["marginTop"]) - 20 - height_added) + "px"
		el.style.marginBottom = (parseInt(style["marginBottom"]) + parseInt(el.style.top)) + "px"

		# Add listeners
		editor.get('nativeEditor').on "selectionChange", @handleSelectionChange
		editor.get('nativeEditor').on "focus", (e) =>
			setTimeout ( =>
				@handleSelectionChange(e)
			), 100
		editor.get('nativeEditor').on "click", @handleSelectionChange
		editor.get('nativeEditor').on "change", @handleChange
		editor.get('nativeEditor').on 'imageAdd', (e) =>
			if e.data.el.$.width > 0
				@handleImageAdd(e)
			else
				setTimeout ( =>
					@handleImageAdd(e)
				), 100
		editor.get('nativeEditor').on "actionPerformed", @handleAction
		editor.get('nativeEditor').on 'afterCommandExec', @handleCommand

		window.editor = editor

		@el_last_created = null

		@image_size_limit = 200*1024
		@image_resize_width = 1200
		@image_resize_height = 900
		@image_preverse_ratio = true
		@image_try_png = false

		return @


	calcSize: (source_width, source_height, target_width, target_height) ->
		if source_width <= target_width and source_height <= target_height
			return [source_width, source_height]

		width = target_width
		height = width * (source_height / source_width);
		if height > target_height
			height = target_height
			width = height * (source_width / source_height)
		return [Math.round(width), Math.round(height)]


	scaleHalf: (image) ->
		canvas = document.createElement("canvas")
		canvas.width = image.width / 1.5
		canvas.height = image.height / 1.5
		ctx = canvas.getContext("2d")
		ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
		return canvas


	resizeImage: (image, width, height) =>
		canvas = document.createElement("canvas")
		if @image_preverse_ratio
			[canvas.width, canvas.height] = @calcSize(image.width, image.height, width, height)
		else
			canvas.width = width
			canvas.height = height

		ctx = canvas.getContext("2d")
		ctx.fillStyle = "#FFF"
		ctx.fillRect(0, 0, canvas.width, canvas.height)
		image_resized = image
		while image_resized.width > width * 1.5
			image_resized = @scaleHalf(image_resized)
		ctx.drawImage(image_resized, 0, 0, canvas.width, canvas.height)

		if @image_try_png and @getExtension(image.src) == "png"  # and canvas.width < 1400 and canvas.height < 1000
			###
			quant = new RgbQuant({colors: 256, method: 1})
			quant.sample(canvas)
			quant.palette(true)
			canvas_quant = drawPixels(quant.reduce(canvas), width)
			optimizer = new CanvasTool.PngEncoder(canvas_quant, { bitDepth: 8, colourType: CanvasTool.PngEncoder.ColourType.TRUECOLOR })
			image_base64uri = "data:image/png;base64," + btoa(optimizer.convert())
			###
			image_base64uri = canvas.toDataURL("image/png", 0.1)
			if image_base64uri.length > @image_size_limit
				# Too large, convert to jpg
				@log "PNG too large (#{image_base64uri.length} bytes), convert to jpg instead"
				image_base64uri = canvas.toDataURL("image/jpeg", 0.7)
			else
				@log "Converted to PNG"
		else
			image_base64uri = canvas.toDataURL("image/jpeg", 0.7)

		@log "Resized #{image.width}x#{image.height} to #{canvas.width}x#{canvas.height} (#{image_base64uri.length} bytes)"
		return [image_base64uri, canvas.width, canvas.height]

	getExtension: (data) =>
		return data.match("/[a-z]+")[0].replace("/", "").replace("jpeg", "jpg")

	handleImageAdd: (e) =>
		if e.data.file.name
			name = e.data.file.name.replace(/[^\w\.-]/gi, "_")
		else
			name = Time.timestamp() + "." + @getExtension(e.data.file.type)
		e.data.el.$.style.maxWidth = "2400px"  # Better resize quality

		if e.data.file.size > @image_size_limit
			@log "File size #{e.data.file.size} larger than allowed #{@image_size_limit}, resizing..."
			[image_base64uri, width, height] = @resizeImage(e.data.el.$, @image_resize_width, @image_resize_height)
			e.data.el.$.src = image_base64uri
			name = name.replace(/(png|gif|jpg)/, @getExtension(image_base64uri))  # Change extension if necessary
		else
			image_base64uri = e.data.el.$.src
			width = e.data.el.$.width
			height = e.data.el.$.height
		# e.data.el.remove()  # Don't allow image upload yet
		e.data.el.$.style.maxWidth = ""  # Show in standard size
		e.data.el.$.alt = "#{name} (#{width}x#{height})"
		@handleImageSave(name, image_base64uri, e.data.el.$)


	# Html fixes
	handleAction: (e) =>
		el = e.editor.getSelection().getStartElement()
		# Convert  Pre to Pre > Code
		if el.getName() == "pre"
			@log("Fix pre")
			new_el = new CKEDITOR.dom.element("code")
			new_el.setHtml(el.getHtml().replace(/\u200B/g, ''))
			el.setHtml("")

			e.editor.insertElement(new_el)
			ranges = e.editor.getSelection().getRanges()
			ranges[0].startContainer = new_el
			e.editor.getSelection().selectRanges(ranges)

		# Remove Pre > Code
		if el.getName() == "pre" and e.data._style.hasOwnProperty("removeFromRange")
			@log("Remove pre")
			new_el = new CKEDITOR.dom.element("p");
			new_el.insertAfter(el)
			new_el.setHtml(el.getFirst().getHtml().replace(/\n/g, "<br>").replace(/\u200B/g, ''))
			el.remove()
			selectElement(e.editor, new_el)

		# Remove Pre > Code focused on code
		else if el.getName() == "code" and e.data._style.hasOwnProperty("removeFromRange")
			@log("Remove code")
			new_el = new CKEDITOR.dom.element("p")
			new_el.insertAfter(el.getParent())
			new_el.setHtml(el.getHtml().replace(/\n/g, "<br>").replace(/\u200B/g, ''))
			el.getParent().remove()
			selectElement(e.editor, new_el)

		# Convert multi-line code to Pre > Code
		else if el.getName() == "code" && el.getHtml().indexOf("<br>") > 0
			@log("Fix multiline code")
			new_el = new CKEDITOR.dom.element("pre");
			new_el.insertAfter(el)
			el.appendTo(new_el)
			selectElement(e.editor, new_el)

		if el.getName() == "h2" or el.getName() == "h3"
			selectElement(e.editor, el)

		@handleChange(e)


	handleCommand: (e) =>
		# Reset style on enter
		if e.data.name == 'enter'
			el = e.editor.getSelection().getStartElement()

			if el.getText().replace(/\u200B/g, '') == "" and el.getName() != "p" and el.getParent().getName() == "p"
				el.remove()

		# Reset style on shift+enter within code
		else if e.data.name == 'shiftEnter'
			el = e.editor.getSelection().getStartElement();
			if el.getName() == "code" && el.getNext() && el.getNext().getName && el.getNext().getName() == "br"
				el.getNext().remove()


	handleChange: (e) =>
		@handleSelectionChange(e)


	handleSelectionChange: (e) =>
		if @el_last_created and @el_last_created.getText().replace(/\u200B/g, '').trim() != ""
			@el_last_created.removeClass("empty")
			@el_last_created = null

		el = e.editor.getSelection().getStartElement()
		if el.getName() == "br"
			el = el.getParent()
		toolbar_add = document.querySelector(".ae-toolbar-add")
		if !toolbar_add or !el
			return false

		if el.getText().replace(/\u200B/g, '').trim() == ""
			if el.getName() == "h2" or el.getName() == "h3"
				el.addClass("empty")
				@el_last_created = el
			toolbar_add.classList.remove("lineselected")
			toolbar_add.classList.add("emptyline")
		else
			toolbar_add.classList.add("lineselected")
			toolbar_add.classList.remove("emptyline")

		# Remove toolbar moving
		###
		if e.editor.element.getPrivate().events.mouseout?.listeners.length
			e.editor.element.removeListener("mouseout", e.editor.element.getPrivate().events.mouseout.listeners[0].fn)

		if e.editor.element.getPrivate().events.mouseleave?.listeners.length
			# Keep only mouseout
			func = e.editor.element.getPrivate().events.mouseleave.listeners[0]
			console.log "remove", e.editor.element.removeListener("mouseleave", func.fn)
			e.editor.element.on "mouseleave", (e_leave) ->
				if document.querySelector(".ae-toolbar-styles") == null
					window.editor._mainUI.forceUpdate()
					func(e_leave, e_leave.data)
		###





window.CustomAlloyEditor = CustomAlloyEditor