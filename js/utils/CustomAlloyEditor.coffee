class CustomAlloyEditor extends Class
	constructor: (@tag) ->
		editor = AlloyEditor.editable(@tag)
		editor.get('nativeEditor').on "selectionChange", @handleSelectionChange
		editor.get('nativeEditor').on "focus", (e) =>
			setTimeout ( =>
				@handleSelectionChange(e)
			), 100
		editor.get('nativeEditor').on "click", @handleSelectionChange
		editor.get('nativeEditor').on "change", @handleChange
		editor.get('nativeEditor').on 'imageAdd', (e) ->
			e.data.el.remove()  # Don't allow image upload yet
		editor.get('nativeEditor').on "actionPerformed", @handleAction
		editor.get('nativeEditor').on 'afterCommandExec', @handleCommand

		@el_last_created = null

		return editor


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
		if e.editor.element.getPrivate().events.mouseout?.listeners.length
			e.editor.element.removeListener("mouseout", e.editor.element.getPrivate().events.mouseout.listeners[0].fn)
		if e.editor.element.getPrivate().events.mouseleave?.listeners.length
			e.editor.element.removeListener("mouseleave", e.editor.element.getPrivate().events.mouseleave.listeners[0].fn)


window.CustomAlloyEditor = CustomAlloyEditor