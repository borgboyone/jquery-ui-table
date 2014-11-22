jquery-ui-table
===============

The jQuery UI table widget enables a host of features for plain tables in HTML documents.

At a minimum, the widget provides the ever elusive, yet simple, y axis scrolling for tbody, allowing stationary header and footer.  Column widths are maintained between all table elements, even with the scrollbar present.  Column headers can be made resizable allowing users to adjust widths to their preference.  Complementing resizable headers, is x axis scrolling, which enables users to enlarge columns beyond the table width boundary.  The option to restrict the minimum column widths total to table width is also available.

The minimum, maximum, and initial widths of column headers are configurable either statically or via passing a function as a parameter.  Column headers may also be made resizable independent of each other.

Full feature list:

- X and Y axis scrolling with stationary header and footer.
- Resizable headers.
- Specify minimum, maximum, and initial widths for table columns.
- Various option formats are accepted: single value, array, and function.
- Increase header widths via resize beyond apparent table width.
- Synchronized scrolling of header and footer with the x-axis.
- Limit minimum columns widths to apparent table size during resize.
- Resize function provided for dynamic and fluid layout.
- Destroy completely restores the table to its initial state.

More demos and information: http://borgboyone.github.io/jquery-ui-table/

Limitations
-----------
Tables with borders and/or padding are supported.  A border-spacing of 0 is highly recommended and columns must not have widths set via CSS for resizing to function properly.  Effective minimums should be provided in the configuration as column widths between the header and body will unsynchronize when either the header column pack size or the body column pack size is reached.

Examples
--------
If no options are provided, the table is given the ability for y-axis scrolling, but unless the height is changed, the scrollbar will not be present as width and height are taken from the table size as apparent in the document.

Simple y-axis scrolling:
```js
$('#my-table').table({scrollable: ['y'], height: 300});
```
Column headers can be resizable with x-axis scrolling and no y-axis scrolling with the minimum column widths set to table width:
```js
$('#my-table').table({scrollable: ['x'], columns: {resizable: true}, keepColumnsTableWidth: true});
```
Column header options can be set via various formats:
```js
$('#my-table').table({
     columns: {
          resizable: true,              // all column headers are resizable
          minWidths: [40, 40, 40, 40],  // an array of integer values; the array length must match the number of table columns
          maxWidths: 300,               // a single value can be specified which will be applied to all column headers that are resizable
          initialWidths: function() {   // again, functions can provide for dynamic configuration
               var width = $('#my-table').width();
               var ps = [40, 15, 30, 15];
               return ps.map( function(value, i){ return Math.floor(width * value / 100); } );
          },
     }
});
```

License
-------
MIT License. Copyright 2014, Anthony Wells.
