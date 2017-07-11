/*!
 * jQuery plugin - jquery.addEventType.js v1.0
 * http://github.com/iwill/
 */
(function($) {
    $.addEventType = $.fn.addEventType = function(eventType) {
        (this.fn || this)[eventType] = function(handler) {
            return handler ? this.bind(eventType, handler) : this.trigger(eventType);
        };
        return this;
    };
})(jQuery);
