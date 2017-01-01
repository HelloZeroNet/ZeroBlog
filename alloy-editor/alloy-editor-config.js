CKEDITOR.lang['en'] = {"editor":"Rich Text Editor","editorPanel":"Rich Text Editor panel","common":{"editorHelp":"Press ALT 0 for help","browseServer":"Browse Server","url":"URL","protocol":"Protocol","upload":"Upload","uploadSubmit":"Send it to the Server","image":"Image","flash":"Flash","form":"Form","checkbox":"Checkbox","radio":"Radio Button","textField":"Text Field","textarea":"Textarea","hiddenField":"Hidden Field","button":"Button","select":"Selection Field","imageButton":"Image Button","notSet":"<not set>","id":"Id","name":"Name","langDir":"Language Direction","langDirLtr":"Left to Right (LTR)","langDirRtl":"Right to Left (RTL)","langCode":"Language Code","longDescr":"Long Description URL","cssClass":"Stylesheet Classes","advisoryTitle":"Advisory Title","cssStyle":"Style","ok":"OK","cancel":"Cancel","close":"Close","preview":"Preview","resize":"Resize","generalTab":"General","advancedTab":"Advanced","validateNumberFailed":"This value is not a number.","confirmNewPage":"Any unsaved changes to this content will be lost. Are you sure you want to load new page?","confirmCancel":"You have changed some options. Are you sure you want to close the dialog window?","options":"Options","target":"Target","targetNew":"New Window (_blank)","targetTop":"Topmost Window (_top)","targetSelf":"Same Window (_self)","targetParent":"Parent Window (_parent)","langDirLTR":"Left to Right (LTR)","langDirRTL":"Right to Left (RTL)","styles":"Style","cssClasses":"Stylesheet Classes","width":"Width","height":"Height","align":"Alignment","alignLeft":"Left","alignRight":"Right","alignCenter":"Center","alignJustify":"Justify","alignTop":"Top","alignMiddle":"Middle","alignBottom":"Bottom","alignNone":"None","invalidValue":"Invalid value.","invalidHeight":"Height must be a number.","invalidWidth":"Width must be a number.","invalidCssLength":"Value specified for the \"%1\" field must be a positive number with or without a valid CSS measurement unit (px, %, in, cm, mm, em, ex, pt, or pc).","invalidHtmlLength":"Value specified for the \"%1\" field must be a positive number with or without a valid HTML measurement unit (px or %).","invalidInlineStyle":"Value specified for the inline style must consist of one or more tuples with the format of \"name : value\", separated by semi-colons.","cssLengthTooltip":"Enter a number for a value in pixels or a number with a valid CSS unit (px, %, in, cm, mm, em, ex, pt, or pc).","unavailable":"%1<span class=\"cke_accessibility\">, unavailable</span>","keyboard":{"8":"Backspace","13":"Enter","16":"Shift","17":"Ctrl","18":"Alt","32":"Space","35":"End","36":"Home","46":"Delete","224":"Command"},"keyboardShortcut":"Keyboard shortcut"},"basicstyles":{"bold":"Bold","italic":"Italic","strike":"Strikethrough","subscript":"Subscript","superscript":"Superscript","underline":"Underline"},"blockquote":{"toolbar":"Block Quote"},"clipboard":{"copy":"Copy","copyError":"Your browser security settings don't permit the editor to automatically execute copying operations. Please use the keyboard for that (Ctrl/Cmd+C).","cut":"Cut","cutError":"Your browser security settings don't permit the editor to automatically execute cutting operations. Please use the keyboard for that (Ctrl/Cmd+X).","paste":"Paste","pasteArea":"Paste Area","pasteMsg":"Please paste inside the following box using the keyboard (<strong>Ctrl/Cmd+V</strong>) and hit OK","securityMsg":"Because of your browser security settings, the editor is not able to access your clipboard data directly. You are required to paste it again in this window.","title":"Paste"},"horizontalrule":{"toolbar":"Insert Horizontal Line"},"indent":{"indent":"Increase Indent","outdent":"Decrease Indent"},"justify":{"block":"Justify","center":"Center","left":"Align Left","right":"Align Right"},"list":{"bulletedlist":"Insert/Remove Bulleted List","numberedlist":"Insert/Remove Numbered List"},"pastefromword":{"confirmCleanup":"The text you want to paste seems to be copied from Word. Do you want to clean it before pasting?","error":"It was not possible to clean up the pasted data due to an internal error","title":"Paste from Word","toolbar":"Paste from Word"},"removeformat":{"toolbar":"Remove Format"},"undo":{"redo":"Redo","undo":"Undo"},"widget":{"move":"Click and drag to move","label":"%1 widget"}};
CKEDITOR.config.stylesSet = [];  // We don't need styles.js
CKEDITOR.document.appendStyleSheet = function(e) { return e };  // We load editor.css manually
AlloyEditor.Strings = {"alignCenter":"Center","alignJustify":"Justify","alignLeft":"Left","alignRight":"Right","bold":"Bold","bulletedlist":"Insert/Remove Bulleted List","cancel":"Cancel","horizontalrule":"Insert Horizontal Line","italic":"Italic","numberedlist":"Insert/Remove Numbered List","quote":"Block Quote","removeformat":"Remove Format","strike":"Strikethrough","subscript":"Subscript","superscript":"Superscript","underline":"Underline","formatted":"Formatted","h1":"Heading 1","h2":"Heading 2","normal":"Normal","blockStyles":"Block Styles","inlineStyles":"Inline Styles","objectStyles":"Object Styles","styles":"Styles","cell":"Cell","cellDelete":"Delete Cells","cellInsertAfter":"Insert Cell After","cellInsertBefore":"Insert Cell Before","cellMerge":"Merge Cells","cellMergeDown":"Merge Down","cellMergeRight":"Merge Right","cellSplitHorizontal":"Split Cell Horizontally","cellSplitVertical":"Split Cell Vertically","column":"Column","columnDelete":"Delete Columns","columnInsertAfter":"Insert Column After","columnInsertBefore":"Insert Column Before","deleteTable":"Delete Table","row":"Row","rowDelete":"Delete Rows","rowInsertAfter":"Insert Row After","rowInsertBefore":"Insert Row Before","add":"Add","ariaUpdateNoToolbar":"No toolbars are available","ariaUpdateOneToolbar":"{toolbars} toolbar is available. Press ALT+F10 to focus.","ariaUpdateManyToolbars":"{toolbars} toolbars are available. Press ALT+F10 to focus.","camera":"Insert Image from Camera","cite":"Cite","code":"Code","clearInput":"Clear Input Field","confirm":"Confirm","editLink":"Type or paste link here","image":"Insert Image","link":"Link","removeLink":"Remove link","table":"Insert Table","twitter":"Twitter","headers":"Headers","headersBoth":"Both","headersColumn":"First column","headersNone":"None","headersRow":"First Row","linkTargetBlank":"_blank (new tab)","linkTargetDefault":"default","linkTargetParent":"_parent","linkTargetSelf":"_self (same tab)","linkTargetTop":"_top","cameraDisabled":"The browser does not support this action, or it is available on https only (Chrome).","indent":"Increase Indent","outdent":"Decrease Indent","deleteEmbed":"Delete embed","columns":"Cols","rows":"Rows"};
AlloyEditor._langResourceRequested = true;  // We include en.js

// Inline code button
React = AlloyEditor.React;
var ButtonInlineCode = React.createClass({
    displayName: 'ButtonInlineCode',
    mixins: [AlloyEditor.ButtonStyle, AlloyEditor.ButtonStateClasses, AlloyEditor.ButtonActionStyle],
    propTypes: {
        editor: React.PropTypes.object.isRequired,
        label: React.PropTypes.string,
        tabIndex: React.PropTypes.number
    },

    statics: {
        key: 'inlinecode'
    },

    getDefaultProps: function getDefaultProps() {
        return {
            style: {
                element: 'code'
            }
        };
    },

    render: function render() {
        var cssClass = 'ae-button ' + this.getStateClasses();

        return React.createElement(
            'button',
            { 'aria-label': AlloyEditor.Strings.code, 'aria-pressed': cssClass.indexOf('pressed') !== -1, className: cssClass, 'data-type': 'button-code', onClick: this.applyStyle, tabIndex: this.props.tabIndex, title: AlloyEditor.Strings.code },
            React.createElement('span', { className: 'ae-icon-code' })
        );
    }
});

AlloyEditor.Buttons[ButtonInlineCode.key] = AlloyEditor.ButtonInlineCode = ButtonInlineCode;


var ButtonH3 = React.createClass({
    displayName: 'ButtonH3',
    mixins: [AlloyEditor.ButtonStyle, AlloyEditor.ButtonStateClasses, AlloyEditor.ButtonActionStyle],
    propTypes: {
        editor: React.PropTypes.object.isRequired,
        label: React.PropTypes.string,
        tabIndex: React.PropTypes.number
    },

    statics: {
        key: 'h3'
    },

    getDefaultProps: function getDefaultProps() {
        return {
            style: {
                element: 'h3'
            }
        };
    },

    render: function render() {
        var cssClass = 'ae-button ' + this.getStateClasses();

        return React.createElement(
            'button',
            { 'aria-label': AlloyEditor.Strings.h3, 'aria-pressed': cssClass.indexOf('pressed') !== -1, className: cssClass, 'data-type': 'button-h3', onClick: this.applyStyle, tabIndex: this.props.tabIndex, title: "Heading 3" },
            React.createElement('span', { className: 'ae-icon-h3' })
        );
    }
});

AlloyEditor.Buttons[ButtonH3.key] = AlloyEditor.ButtonH3 = ButtonH3;


selections = AlloyEditor.Selections
selections.unshift({
    name: 'text',
    buttons: ['bold', 'italic', 'strike', 'inlinecode', 'link'],
    test: AlloyEditor.SelectionTest.text
})
// Remove Image toolbar
AlloyEditor.Core.ATTRS.toolbars.value.styles.selections.forEach(
    function(selection, i, selections) {
        if (selection.name == "image") selections.splice(i, 1)
    }
)


// Other settings
CKEDITOR.config.language = "en"
CKEDITOR.config.title = ""
CKEDITOR.config.fullPage  = true
CKEDITOR.config.pasteFromWordRemoveFontStyles = true
CKEDITOR.config.removePlugins = "dragdrop"
AlloyEditor.Core.ATTRS.removePlugins.value += ',ae_embed,ae_imagealignment,ae_dragresize'
AlloyEditor.Buttons.linkEdit.defaultProps.appendProtocol = false
CKEDITOR.config.buttonCfg = {
    buttonLinkEdit: {
        appendProtocol: false
    }
}
AlloyEditor.Core.ATTRS.toolbars.value = {
    add: {
        buttons: ['h2', 'h3', 'quote', 'code', 'hline', 'table', 'image'],
        tabIndex: 2
    },
    styles: {
        selections: selections,
        tabIndex: 1
    }
}
CKEDITOR.config.customConfig = "";

// Helpers

function createSelectionFromPoint(startX, startY, endX, endY) {  // Select text based on x y coordinates
    var doc = document;
    var start, end, range = null;
    if (typeof doc.caretPositionFromPoint != "undefined") {
        start = doc.caretPositionFromPoint(startX, startY);
        end = doc.caretPositionFromPoint(endX, endY);
        range = doc.createRange();
        range.setStart(start.offsetNode, start.offset);
        range.setEnd(end.offsetNode, end.offset);
    } else if (typeof doc.caretRangeFromPoint != "undefined") {
        start = doc.caretRangeFromPoint(startX, startY);
        end = doc.caretRangeFromPoint(endX, endY);
        range = doc.createRange();
        range.setStart(start.startContainer, start.startOffset);
        range.setEnd(end.startContainer, end.startOffset);
    }
    if (range !== null && typeof window.getSelection != "undefined") {
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    } else if (typeof doc.body.createTextRange != "undefined") {
        range = doc.body.createTextRange();
        range.moveToPoint(startX, startY);
        var endRange = range.duplicate();
        endRange.moveToPoint(endX, endY);
        range.setEndPoint("EndToEnd", endRange);
        range.select();
    }
}

function selectElement(editor, elem) {  // Select CKEditor element
    var range = new CKEDITOR.dom.range(editor.document);
    range.moveToElementEditablePosition(elem, true);
    range.setStart(elem, 0)
    range.setEnd(elem, elem.getChildCount())
    editor.getSelection().selectRanges([range]);
}