(function( factory ) {
	if ( typeof define === "function" && define.amd ) {

		// AMD. Register as an anonymous module.
		define([ "jquery" ], factory );
	} else {

		// Browser globals
		factory( jQuery );
	}
}(function( $ ) {

/*!
 * jQuery UI Table 1.0.0
 * https://github.com/borgboyone/jquery-ui-table
 *
 * Copyright 2014 Anthony Wells
 * Released under the MIT license.
 * https://raw.githubusercontent.com/borgboyone/jquery-ui-table/master/LICENSE
 *
 * http://borgboyone.github.io/jquery-ui-table/
 */

var table = $.widget( "aw.table", {
	defaultElement: "<table>",
	options: {
		scrollable: ['y'],
// This would be correct and proper:
// columns: [{resizable:, minWidth:, maxWidth:, initialWidth:}, ...]
// but very difficult to work with in a functional capacity
		columns: {
					resizable: null,
					minWidths: null,
					maxWidths: null,
					initialWidths: null
				},
		width: null,
		height: null,
		keepColumnsTableWidth: true, // keepMinTotalColumnWidthAtTableSize, keepTotalMinColWidthAtTableWidth
	},
	_getWidth: function(e) {
		return $(e).outerWidth();
	},
	_setWidth: function(e, outer) {
		var $e = $(e);
		var width = outer - ($e.outerWidth() - $e.width());
		$e.width(width);
	},
	_getHeight: function(e) {
		return $(e).outerHeight();
	},
	_setHeight: function(e, outer) {
		var $e = $(e);
		var height = outer - ($e.outerHeight() - $e.height());
		$e.height(height);
	},
	_initWidths: function(initialWidths) {
		var that = this;
		var total = 0;
		if (this.columns.initialWidths == null) {
			this.columns.initialWidths = this.element.find("> thead > tr:first-child,> tbody > tr:first-child").first().children()
				.map(function(i, e) { return that._getWidth(e); }).get();
			total = this.innerSize.width;
		} else {
			for(var i = 0; i < this.columns.initialWidths.length; i++) {
				total += this.columns.initialWidths[i];
			}
			// TODO: clean this up (might be better inside-out)
			if (this.scrollable.x) {
				if (total > this.innerSize.width) {
					// mark setBodyWidths(total); FIIXME: must do, possibly a transient function
				} else if (total < this.innerSize.width) {
					if (this.options.keepColumnsTableWidth) {
						this.columns.initialWidths = this._scale(this.columns.initialWidths, this.innerSize.width, total);
						// we could pass max on columns
						total = this.innerSize.width;
					} else {
						// mark setBodyWidths(total); FIXME: verify this, may not be needed, fairly certain it is
					}
				}
			} else {
				// or do nothing and allow overflow hidden (or take actual widths) makes percentages easy though
				if (total != this.innerSize.width) {
					this.columns.initialWidths = this._scale(this.columns.initialWidths, this.innerSize.width, total);
					// we could pass min or max, depending on scale up or down
					total = this.innerSize.width;
				}
			}
		}
		return { widths: this.columns.initialWidths, scaled_widths: [], resized_widths: [], total: total };
	},
	_hasScroll: function(element) {
		var $element = $(element);
		return {
			'x': $element.outerWidth() < $element.prop( "scrollWidth" ),
			'y': $element.outerHeight() < $element.prop( "scrollHeight" )
		};
	},
	// on refresh, remove scroll, add it back to overflow-y.  Rerun setColumnWidths
	_setColumnWidths: function(widths) {
		var that = this;
		// set normal widths in tbody, browser will adjust widths for the 
		// scroll bar automatically
		$(this.element).find("> tbody tbody").find("tr:first-child").each(
			function(i,e) {
				$(e).children().each(
					function(i,e) {
							that._setWidth(e, widths[i]);
					}
				);
			}
		);
		// if has tbody and rows and has_scroll get widths apply to thead, tfoot and add
		// scrollbarWidth to last column
		var tbody = $(this.element).find("> tbody").get(0);
		that.has_scroll = tbody.offsetHeight < tbody.scrollHeight;
		$(this.element).find("> tbody tbody:first > tr:first-child").children().each(
			function(i,e) {
				that.col_desc.scaled_widths[i] = that._getWidth(e);
			}
		);
		$(this.element).find("thead,tfoot").find("> tr:first-child").each(
			function(i,e) {
				$(e).children().each(
					function(i,e) {
						if (i != that.col_desc.scaled_widths.length - 1) {
							that._setWidth(e, that.col_desc.scaled_widths[i]);
						} else {
							that._setWidth(e, that.col_desc.scaled_widths[i] + (that.has_scroll ? that.sbwidth : 0) );
						}
					}
				);
			}
		);
	},
	_setBodyWidth: function(width) {
		// we expect thead, tbody and tfoot not to have borders or padding, so no need for _setWidth
		this.element.find("> tbody tbody:first").width(width + 'px');
		// TODO: scroll bar may dissappear after updating column widths, only if new width is 
		// larger than the original, but for now...
		// set widths for tr of tbody, get has_scroll, then set width of thead,tfoot
		var tbody = this.element.find("> tbody").get(0);
		this.hasScroll.y = tbody.offsetHeight < tbody.scrollHeight;

		this.element.find("> thead > tr,> tfoot > tr").width(width + (this.hasScroll.y ? this.sbwidth : 0) + 'px');
	},
	_setBodyBounds: function() {
		// Chrome and Firefox use different stock box-sizing for the table element
		// to combat having to look at the box-sizing model for the time being, set display block on tbody first, at which point
		// the table css height becomes valid
		var tbody_height = this.element.height() // this.size.height - ($(this.element).outerHeight() - $(this.element).height())
			- this.element.find("thead,tfoot").map(
				function(i, e) { 
					return $(e).length ? $(e).outerHeight() : 0; 
				}
			).get().reduce(
				function(prev, current) {
					return prev + current; 
				}, 
				0
			);
		this.element.find("> tbody").css({'width': this.innerSize.width + 'px', 'height': tbody_height + 'px'});
	},
	// require thead or tbody?
	_create: function() {
		this._super();
		//this.init = false;
		var that = this;
		var $table = this.$element = this.element;
		this.sbwidth = jQuery.position.scrollbarWidth();
		this.size = this._parseSize(this.options.width, this.options.height);
		this.scrollable = this._parseScrollable(this.options.scrollable);
		this.columnCount = $table.find("thead > tr:first-child,tbody > tr:first-child").first().children().length;
		this.columns = this._parseColumns(this.options.columns);

		// store original styles and widths where necessary for _destroy
		// MAYBE: May need to detach colgroup
		this.styles = {};
		this.styles.table = $table.attr("style");
		this.styles.thead = $table.find("> thead").attr("style");
		this.styles.thead_tr = $table.find("> thead > tr").attr("style");
		this.styles.tfoot = $table.find("> tfoot").attr("style");
		this.styles.tfoot_tr = $table.find("> tfoot > tr").attr("style");
		this.styles.tbody = $table.find("> tbody").attr("style");

		// set container (ie. table) size based on options
		this.size = {'width': (this.size.width !== null) ? this.size.width : this._getWidth($table), 'height': (this.size.height !== null) ? this.size.height : this._getHeight($table)};
		this.innerSize = {'width': this.size.width - ($table.outerWidth() - $table.width()), 'height': this.size.height - ($table.outerHeight() - $table.height())};

		// set table size
		$table.css({'width': this.size.width + 'px', 'height': this.size.height + 'px'});

		this.col_desc = this._initWidths();

		// Try to do this in an order such that there is no discernable screen flicker of elements
		// We don't need to do wrapping of tbody if we're only scrolling on the y-axis but for
		// consistency of selectors, we add it regardless.
		$table.css({'position': 'relative', 'box-sizing': 'border-box', 'display': 'block', 
			'overflow': 'hidden'})
		.find("> thead").css({'display': 'block', 'position': 'absolute', 'top': $table.css('padding-top'),
			'width': this.innerSize.width + 'px', 'height': $table.find("thead > tr").outerHeight() + 'px', 'overflow': 'hidden'})
			.find("> tr").css({'left': '0px', 'top': '0px', 'position': 'absolute'}).end().end()
		.find("> tfoot").css({'display': 'block', 'position': 'absolute', 'bottom': $table.css('padding-bottom'),
			'width': this.innerSize.width + 'px', 'height': $table.find("tfoot > tr").outerHeight() + 'px', 'overflow': 'hidden'})
			.find("> tr").css({'left': '0px', 'top': '0px', 'position': 'absolute'}).end().end()
		.find("> tbody").css({'display': 'block', 'position': 'absolute', 'top': '0px'})
		.wrap('<tbody style="display: block; position:absolute; overflow-x: ' + (this.scrollable.x ? 'auto' : 'hidden') + '; overflow-y: ' + (this.scrollable.y ? 'auto' : 'hidden') + '; top: ' +
			($table.find("thead").outerHeight() + parseFloat($table.css('padding-top'))) + 'px;"><tr><td style="padding: 0px;">' + 
			'<table style="box-sizing: border-box; display: block; border: 0px none;"></table></td></tr></tbody>');

		// copy classes to nested table (make sure we stop at our first table; "> tbody table:first" will also work)
		$table.find("> tbody > tr > td > table").attr("class", $table.attr("class"));

		// set tbody size
		this._setBodyBounds();

		// MAYBE: It is possible to get the absolute mins from thead/tbody here while the columns are packed
		// minWidth = min(thead>th, tbody>td) options.autoSet[Widths] = true; or minWidths: "auto-set";

		this.hasScroll = {};
		if (this.scrollable.x && (this.col_desc.total > this.innerSize.width)) {
			this._setBodyWidth(this.col_desc.total);
		}
		this._setColumnWidths(this.col_desc.widths); //this.refresh();

		this.hasScroll = this._hasScroll($table.find("> tbody"));// {'x': false, 'y': false};
		if (this.hasScroll.x) {
			this._on( $table.find("> tbody").get(0), {"scroll": function(event) {
				var offset = -1 * $(event.target).scrollLeft();// + parseFloat($(that.element).css('paddingLeft'));
				$table.find("> thead,> tfoot").find("> tr").css('left', offset + 'px');
			}});
		}

		if ((this.columns.resizable != null) && $(this.element).find("thead > tr:first-child").length) {
			var resizable_params = this._getResizeableParams();
			this.element.find("> thead > tr:first-child").children().each(function(i,e) {
				if (that.columns.resizable[i]) {
					if (that.columns.minWidths != null) {
						resizable_params['minWidth'] = that.columns.minWidths[i];
					}
					if (that.columns.maxWidths != null) {
						resizable_params['maxWidth'] = that.columns.maxWidths[i];
					}
					$(e).resizable(resizable_params);
				}
			});
		}

		// TODO: add theme classes to the various table components
		//ui-widget-header ui-table-header
		//ui-widget-header ui-table-footer
		//ui-container ui-table-body
	},
	_destroy: function() {
		var that = this;
		// destroy resizers, if present
		if (this.columns.resizable !== null) {
			this.element.find("> thead > tr:first-child").children().each(function(i,e) {
				if (that.columns.resizable[i]) {
					$(e).resizable("destroy");
				}
			});
		}
		// Restore tbody (unwrap really needs a parent selector or a level)
		this.element.find("> tbody tbody:first").unwrap().unwrap().unwrap().unwrap();
		// Restore css by setting old styles
		this.element.find("> thead").find("> tr").attr("style", (typeof this.styles.thead_tr === "undefined" ? null : this.styles.thead_tr)).end()
			.attr("style", (typeof this.styles.thead === "undefined" ? null : this.styles.thead)).end()
			.find("> tfoot").find("> tr").attr("style", typeof this.styles.tfoot_tr === "undefined" ? null : this.styles.tfoot_tr).end()
			.attr("style", typeof this.styles.tfoot === "undefined" ? null : this.styles.tfoot).end()
			.find("> tbody").attr("style", typeof this.styles.tbody === "undefined" ? null : this.styles.tbody).end()
			.attr("style", typeof this.styles.table === "undefined" ? null : this.styles.table);
		// remove widths from tfoot tr td, css('width', '');
		this.element.find("> thead > tr:first-child,> tfoot > tr:first-child,> tbody tr:first-child").children().each(function(i, e) { $(e).css('width', ''); });
		// MAYBE: reattached colgroup, if necessary
	},
	// TODO: options, including setOptions
	// if scrollable.x goes from true to false, etc...
	_isNullorUndefined: function(value) {
		return (value === null) || (typeof value == 'undefined');
	},
	_parseSize: function(width, height) {
		var size = {};
		if (this._isNullorUndefined(width) || !this._isPositiveNonZeroInt(width)) {
			size.width = null;
		} else {
			size.width = width;
		}
		if (this._isNullorUndefined(height) || !this._isPositiveNonZeroInt(height)) {
			size.height = null;
		} else {
			size.height = height;
		}
		return size;
	},
	_parseScrollable: function(value) {
		// scrollable true = ['x','y'], ['x','y'] = ['x','y'], 'x' = 'x', 'y' = 'y', 
		var scrollable;
		if (value === true) {
			scrollable = {'x': true, 'y': true};
		} else if (value == 'x') {
			scrollable = {'x': true, 'y': false};
		} else if (value == 'y') {
			scrollable = {'x': false, 'y': true};
		} else if ($.isArray(value)) {
			scrollable = {'x': $.inArray('x', value), 'y': $.inArray('y', value)};
		} else {
			scrollable = {'x': false, 'y': false};
		}
		return scrollable;
	},
	_parseColumns: function(columns) {
		var temp = {};
		temp['resizable'] = this._isNullorUndefined(columns) ? null : this._parseResizable(columns.resizable);
		temp['minWidths'] = this._isNullorUndefined(columns) ? null : this._parseWidth(columns.minWidths);
		temp['maxWidths'] = this._isNullorUndefined(columns) ? null : this._parseWidth(columns.maxWidths);
		// TODO: not zero, larger than min
		temp['initialWidths'] = this._isNullorUndefined(columns) ? null : this._parseWidth(columns.initialWidths);
		// TODO: not zero, between min and max
		return temp;
	},
	_parseResizable: function(resizable) {
		var temp = [];
		if (this._isNullorUndefined(resizable)) {
			return null;
		} else if ($.isFunction(resizable)) {
			temp = resizable();
		} else if ($.isArray(resizable)) {
			temp = resizable;
		} else if (resizable === true) {
			for(var i = 0; i < this.columnCount; i++) {
				temp[i] = true;
			}
			return temp;
		} else {
			return null;
		}
		if (!$.isArray(temp) || (temp.length != this.columnCount) || !temp.every(function(value) { return value === true || value === false; })) {
			return null;
		}
		return temp;
	},
	_isInt: function(value) {
		return +value == Math.floor(+value);
	},
	_isPositiveInt: function(value) {
		return ((+value == Math.floor(+value)) && (+value >= 0));
	},
	_isPositiveNonZeroInt: function(value) {
		return ((+value == Math.floor(+value)) && (+value > 0));
	},
	_parseWidth: function(width) {
		var temp = [];
		if (this._isNullorUndefined(width)) {
			return null;
		} else if ($.isFunction(width)) {
			temp = width();
		} else if ($.isArray(width)) {
			temp = width;
		} else if (this._isPositiveInt(width)) {
			var value = +width;
			for(var i = 0; i < this.columnCount; i++) {
				temp[i] = value;
			}
			return temp;
		} else {
			return null;
		}
		var that = this;
		if (!$.isArray(temp) || (temp.length != this.columnCount) || !temp.every(function(value) { return that._isPositiveInt(value); })) {
			return null;
		}
		return temp;
	},
	_scale: function(widths, finalTotal, currentTotal) {
		if (typeof currentTotal == 'undefined') {
			currentTotal = 0;
			for (var i = 0; i < widths.length; i++) {
				currentTotal += widths[i];
			}
		}
		var scale = finalTotal / currentTotal;
		var newWidths = [];
		var newTotal = 0;
		for (var i = 0; i < widths.length - 1; i++) {
			newWidths[i] = Math.round(scale * widths[i]);
			newTotal += newWidths[i];
		}
		newWidths[i] = finalTotal - newTotal;
		return newWidths;
	},
	resize: function(width, height) {
		var newsize = this._parseSize(width, height);
		var $table = this.element;
		if (newsize.width != null) {
			$table.css('width', width);
			this.size.width = newsize.width;
			this.innerSize.width =  newsize.width - ($table.outerWidth() - $table.width());
			var total = 0;
			for (var i = 0; i < this.col_desc.widths.length; i++) {
				total += this.col_desc.widths[i];
			}
			if (this.scrollable.x) {
				if ((total <= this.innerSize.width) && this.options.keepColumnsTableWidth) {
					this.col_desc.widths = this._scale(this.col_desc.widths, this.innerSize.width, total);
					// may no longer conform to max Widths
					if (this.hasScroll.x) {
						// by clearing the width and going back to auto mode, the v scrollbar issue falls
						// back to setColumnWidths
						$table.find("> tbody tbody:first").css('width', '');
						$table.find("> thead > tr,> tfoot > tr").width(this.innerSize.width + 'px');

						// Earlier versions of jQuery ui needed the jQuery wrapped element for _off
						// We leave this as is for backwards compatibility (-.get(0))
						this._off($table.find("> tbody"), 'scroll');
						this.hasScroll.x = false;
					}
				} else {
				// The actual widths of the thead, tfoot, and tbody do not change in this case but the x-scrollbar may change
				var hadScroll_x = this.hasScroll.x; var hasScroll_x = this._hasScroll($table.find("> tbody")).x;
				if (!hadScroll_x && hasScroll_x) {
					this._on( $table.find("> tbody").get(0), {"scroll": function(event) {
						var offset = -1 * $(event.target).scrollLeft();
						// TODO: verify: "this" is table()
						this.element.find("> thead,> tfoot").find("> tr").css('left', offset + 'px');
					}});
					that._setBodyWidth(total);
					this.hasScroll.x = true;
				} else if (hadScroll_x && !hasScroll_x) {
					this._off($table.find("> tbody"), 'scroll');
					this.hasScroll.x = false;
				}
				}
			} else {
				if (total != this.innerSize.width) { // FIXME: update this.col_desc.total?
					this.col_desc.widths = this._scale(this.col_desc.widths, this.innerSize.width, total);
					// may no longer conform to min or max Widths
				}
			}
			// I think this needs to go before if (this.scrollable.x)
			$table.children().css('width', this.innerSize.width + 'px');
		}
		if (height != null) {
			$table.css('height', height);
			this.size.height = newsize.height;
			 this.innerSize.height = newsize.height - ($table.outerHeight() - $table.height());
			// adjust height of tbody (scroll may vanish or add), addressed in $this->refresh();
			this._setBodyBounds();
		}
		this.refresh();
	},
	refresh: function() {
		this._setColumnWidths(this.col_desc.widths);
	},
	body: function(rows) {
		this.element.find("> tbody tbody:first").html(rows);
		this.refresh();
	},
	_getResizeableParams: function() {
		var that = this;
		var $table = this.element;
		return {
			handles: 'e',
			resize: function(event, ui) {
				// get difference
				var diff = ui.size.width - ui.originalSize.width;
				var ir = $(ui.element).index();
				var total = 0;
				for(var i = 0; i < that.col_desc.widths.length; i++) {
					that.col_desc.resized_widths[i] = that.col_desc.widths[i];
					total += that.col_desc.resized_widths[i];
				}
				// FIXME: We never use total, it's always total + diff, consider adding the ir check in the above loop
				if (that.scrollable.x) {
					// FIXME: should we remove the event for scroll if (total + diff <= that.innerSize.width - that.sbwidth)
					// or simply check to see if it's gone?
					if ((that.options.keepColumnsTableWidth === true) && (total + diff <= that.innerSize.width)) {// - that.sbwidth) {
						if (that.hasScroll.x) {
							// by clearing the width and going back to auto mode, the v scrollbar issue falls
							// back to setColumnWidths
							$table.find("> tbody tbody:first").css('width', '');
							$table.find("> thead > tr,> tfoot > tr").width(that.innerSize.width + 'px');

							// TODO: check this with the latest version of jQuery UI (.get(0))
							that._off($table.find("> tbody"), 'scroll');
							that.hasScroll.x = false;
						}
					} else {
						that.col_desc.resized_widths[ir] = that.col_desc.resized_widths[ir] + diff;
						// TODO: Fix ordering in case v scrollbar vanishes
						that._setBodyWidth(total + diff);
						that._setColumnWidths(that.col_desc.resized_widths);
						// add scroll event listener, if not already added
						if (!that.hasScroll.x) {
							that._on( $table.find("> tbody").get(0), {"scroll": function(event) {
								var offset = -1 * $(event.target).scrollLeft();// + parseFloat($(that.element).css('paddingLeft'));
								$table.find("> thead,> tfoot").find("> tr").css('left', offset + 'px');
							}});
							that.hasScroll.x = true;
						}
						return;
					}
				}
				// Modify diff so that it only reflects the table size
				var mod_diff = (total + diff) - that.innerSize.width;
				total = that.innerSize.width;
				//that.size.width - that.col_desc.resized_widths[ir] - (total + diff) + that.size.width;
				var scale = (total - that.col_desc.resized_widths[ir] - mod_diff)/(total - that.col_desc.resized_widths[ir]);
				var total2 = 0;
				for(i = 0; i < that.col_desc.resized_widths.length; i++) {
					if (i != ir) {
						that.col_desc.resized_widths[i] = Math.round(scale * that.col_desc.resized_widths[i]);
					} else {
						that.col_desc.resized_widths[i] = that.col_desc.resized_widths[i] + diff;
					}
					total2 += that.col_desc.resized_widths[i];
				}
				// reinstate this if there are problems (produces warble on the last column during resizing)
				//that.col_desc.resized_widths[i] = total - total2;  (Warble is almost always: -1, 0, 1 in that order)
				that._setColumnWidths(that.col_desc.resized_widths);
			},
			stop: function(event, ui) {
				// copy scaled_width to widths
				for(var i = 0; i < that.col_desc.widths.length; i++) {
					that.col_desc.widths[i] = that.col_desc.resized_widths[i];
				}
			}
		};
	}
});

}));
