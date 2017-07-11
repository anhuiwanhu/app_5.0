/*
 * BUG - "oo", "o"
 * BUG - trim for highlight
 */
/*!
 * jQuery plugin - jquery.suggest.js v0.x
 * http://github.com/iwill/
 */
/**
 * requires jquery-1.4.*.js, jquery.addEventType.js
 * $.fn.suggest: function(search, options) - the interface for input:text only, or nothing will be done
 *      search: function(keyword, update) - the callback to search by keyword
 *              keyword: string - the keyword to search
 *              update: function(matches, highlight) - the callback to update suggest list by matches
 *                      matches(optional): array - the matches string -s, clear the suggest list if null
 *                      highlight(optional): string - the text to be highlight -ed, use keyword if null
 *      options(optional): object - the settings, use default if null
 *              delayMillis(optional): number - the milliseconds to delay after pressing keys if positive number, not to delay if 0, use 200 if null
 *              maxHeight(optional): number - the max height of the suggest list if positive number, or the height will be auto set
 */
/*
 * TODO: add select event
 * TODO: cacheAll, cacheLast
 * TODO: css in options
 * TODO: html template - format & parse?
 */
jQuery(function($) {
    // constant -s
    var DEFAULT_DELAY_MILLIS = 200, DEFAULT_MAX_HEIGHT = 0;
    var SUGGEST_TEXT = "suggest-text", SUGGEST_LIST = "suggest-list", SUGGEST_SELECTED = "suggest-selected", SUGGEST_OPTIONS = "suggest-options",
            SUGGEST_PREVIOUS_VALUE = "suggest-previous-value", SUGGEST_SEARCHED_KEYWORD = "suggest-searched-keyword";

    // function -s
    var showSuggestions = function(text, list) {
        list.width(text.outerWidth() - 2); // - 2: text.outerWidth() include the border-width, but list.width() set width without the border-width
        var position = text.position();
        position.left = Math.floor(position.left);
        position.top = Math.floor(position.top + text.outerHeight());
        list.css(position).show();
        // set height
        var maxHeight = (text.data(SUGGEST_OPTIONS) || {}).maxHeight;
        maxHeight = maxHeight || DEFAULT_MAX_HEIGHT;
        // this line must be after the showing the list
        // list.height() >= maxHeight for that the height has been set to the maxHeight
        list.height((maxHeight > 0 && list.height() >= maxHeight) ? maxHeight : "auto");
    };
    var hideSuggestions = function(text, list) {
        text.data(SUGGEST_SEARCHED_KEYWORD, null);
        list.find("tr." + SUGGEST_SELECTED).mouseout().end().hide();
    };
    var updateSuggestions = function(text, list, keyword, matches) {
        if (!matches) {
            hideSuggestions(text, list);
            return;
        }
        var suggestions = $("<table />", {
            css: {
                margin: 0,
                padding: 0,
                width: "100%",
                textAlign: "left",
                borderCollapse: "collapse"
            }
        });
        var regExp = new RegExp(keyword + "", "g" + "i");
        for (var each in matches) {
            suggestions.append($("<tr />").append($("<td />", {
                html: matches[each].replace(regExp, "<b style='color: red;'>$&</b>"),
                css: {
                    padding: "4px",
                    whiteSpace: "nowrap"
                }
            })));
        }
        if (suggestions.is(":empty")) {
            hideSuggestions(text, list);
        }
        else {
            list.height("auto").html(suggestions);
            showSuggestions(text, list);
        }
    };

    // interface
    $.fn.suggest = function(search, options) {
        options = options || {};
        return search ? this.each(function() {
            // dom
            var text = $(this);
            if (!text.is(":text") || text.hasClass(SUGGEST_TEXT)) {
                return;
            }
            text.addClass(SUGGEST_TEXT).attr("autocomplete", "off").addEventType("search");
            var list = $("<div />", {
                "class": SUGGEST_LIST,
                css: {
                    position: "absolute",
                    margin: 0,
                    padding: 0,
                    color: "#000000",
                    backgroundColor: "#FFFFFF",
                    borderStyle: "solid",
                    borderWidth: "1px",
                    borderColor: "#7F9DB9",
                    overflowX: "hidden",
                    overfloY: "auto"
                }
            });
            text.after(list.hide());
            // data
            text.data(SUGGEST_LIST, list).data(SUGGEST_SEARCHED_KEYWORD, null).data(SUGGEST_PREVIOUS_VALUE, null).data(SUGGEST_OPTIONS, options);
            list.data(SUGGEST_TEXT, text);
            var timeouter = 0;
            // bind event -s to text
            text.search(function(event) { // no to use change for that change may be triggered by the other event -s, e.g. click on tr of list
                var keyword = text.val();
                text.data(SUGGEST_SEARCHED_KEYWORD, keyword);
                window.clearTimeout(timeouter);
                timeouter = window.setTimeout(function() {
                    search(keyword, /* interface: update */ function(matches, highlight) {
                        updateSuggestions(text, list, highlight || keyword, matches);
                    });
                }, options.delayMillis >= 0 ? options.delayMillis : DEFAULT_DELAY_MILLIS);
            }).keyup(function(event) {
                if (text.data(SUGGEST_PREVIOUS_VALUE) !== text.val() && event.keyCode !== 27) {
                    text.search();
                }
            }).blur(function(event) {
                hideSuggestions(text, list);
            }).keydown(function(event) {
                switch (event.keyCode) {
                    case 13: // Enter
                        if (list.is(":visible")) {
                            list.find("tr." + SUGGEST_SELECTED).mousedown();
                            hideSuggestions(text, list);
                            return false;
                        }
                        break;
                    case 27: // ESC
                        if (list.is(":visible")) {
                            text.val(text.data(SUGGEST_SEARCHED_KEYWORD));
                            hideSuggestions(text, list);
                            return false;
                        }
                        break;
                    case 38: // Up
                        // swith selected
                        if (list.is(":visible")) {
                            var tr = list.find("tr." + SUGGEST_SELECTED);
                            tr = tr.length ? tr.mouseout().prev() : list.find("tr:last");
                            if (tr.length) {
                                text.val(tr.mouseover().find("td:first").text());
                                var trTop = tr.offset().top;
                                var listTop = list.offset().top;
                                if (trTop < listTop) {
                                    tr.get(0).scrollIntoView(true);
                                }
                                else if (trTop + tr.height() > listTop + list.height()) {
                                    tr.get(0).scrollIntoView(false);
                                }
                            }
                            else {
                                text.val(text.data(SUGGEST_SEARCHED_KEYWORD));
                            }
                        }
                        else {
                            text.data(SUGGEST_PREVIOUS_VALUE, null);
                            return;
                        }
                        break;
                    case 40: // Down
                        // swith selected
                        if (list.is(":visible")) {
                            var tr = list.find("tr." + SUGGEST_SELECTED);
                            tr = tr.length ? tr.mouseout().next() : list.find("tr:first");
                            if (tr.length) {
                                text.val(tr.mouseover().find("td:first").text());
                                var trTop = tr.offset().top;
                                var listTop = list.offset().top;
                                if (trTop < listTop) {
                                    tr.get(0).scrollIntoView(true);
                                }
                                else if (trTop + tr.height() > listTop + list.height()) {
                                    tr.get(0).scrollIntoView(false);
                                }
                            }
                            else {
                                text.val(text.data(SUGGEST_SEARCHED_KEYWORD));
                            }
                        }
                        else {
                            text.data(SUGGEST_PREVIOUS_VALUE, null);
                            return;
                        }
                        break;
                    default: ;
                }
                text.data(SUGGEST_PREVIOUS_VALUE, text.val());
            });
        }) : this;
    };

    // live event -s to list
    $("." + SUGGEST_LIST + " tr").live("mousedown", function(event) {
        var self = $(this);
        var text = self.closest("." + SUGGEST_LIST).data(SUGGEST_TEXT);
        text.val(self.find("td:first").text()).data(SUGGEST_SEARCHED_KEYWORD, null);
        window.setTimeout(function() {
            text.focus();
        }, 0);
    }).live("mouseover", function(event) {
        $(this).css({
            color: "#FFFFFF",
            backgroundColor: "#316AC5"
        }).addClass(SUGGEST_SELECTED).siblings("." + SUGGEST_SELECTED).mouseout();
    }).live("mouseout", function(event) {
        $(this).css({
            color: "#000000",
            backgroundColor: "#FFFFFF"
        }).removeClass(SUGGEST_SELECTED);
    });

    return $;
});
