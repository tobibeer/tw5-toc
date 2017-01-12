/*\
title: $:/plugins/tobibeer/toc/filter.js
type: application/javascript
module-type: filteroperator

A filter to fetch titles in a Table Of Contents

@preserve
\*/

(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.toc = function(source,operator,options) {
	var exclude,truncate,was,
		results = [],
		error = "toc filter error: ",
		// Shorthand for suffix
		s = operator.suffix || "",
		// Defaults for options object ...using one simplifies debugging a lot
		$ = {
			// Down to level
			level: -1,
			// The default root
			root: operator.operand || options.widget.getVariable("currentTiddler") || "TableOfContents",
			// The default field
			list: "tags",
			// A filter of titles to exclude
			exclude: "",
			// A filter of titles to truncate the tree at
			truncate: "",
			// No sorting by default
			sort: ""
		},
		// Suffix regexp patterns
		suffixes = [
			// One or more White-spaces
			[/^\s+/, function() {
				// Just consume
			}],
			// A definition of a variable defining a filter to either exclude or truncate
			[/^(exclude|truncate)=\s*([^\s]+)(?:\s|$)/i, function(match) {
				// Store filter for variable
				$[match[1]] = options.widget.getVariable(match[2]);
			}],
			// Whether to sort each level
			[/^sort=\s*([^\s]+)(?:\s|$)/i, function(match) {
				var s = match[1];
				// Store filter for sort field
				$.sort =
					s.charAt(0) !== "!" ?
					"sort[" + s + "]" : 
					"!sort[" + s.substr(1) + "]";
			}],
			// The level to go down to as integer
			[/^level=\s*(-?\d+)(?:\s|$)/i, function(match) {
				// Parse level as int
				var l = parseInt(match[1],10);
				// Only if a number
				if(!isNaN(l)){
					// Remember level
					$.level = l;
				}
			}],
			// list=field
			[/^list\=\s*([^\s]+)(?:\s|$)/i, function(match) {
				// Save specified field
				$.list = match[1];
			}]
		],
		getChildren = function(tag,level) {
			level++;
			var filter = $.list === "tags" ?
				("[[" + tag + "]tagging[]" + $.sort + "]") :
				("[[" + tag + "]listed[" + $.list + "]" + $.sort + "]");
			$tw.utils.each(
				$tw.wiki.filterTiddlers(filter),
				function(tiddler) {
					if(
						// Only add once
						results.indexOf(tiddler) < 0 &&
						// No excluded titles
						exclude.indexOf(tiddler) < 0
					) {
						// Add title
						results.push(tiddler);
						if(
							// If level undefined or we're below it
							($.level === -1 || level < $.level) &&
							// AND not a title to be truncated
							truncate.indexOf(tiddler) < 0
						) {
							// Next level
							getChildren(tiddler,level);
						}
					}
				}
			);
		};
	// Catch errors
	try {
	// Still got some suffix left?
	while(s){
		// Remember suffix remainder we started out with
		was = s;
		// Loop suffix regex patterns
		$tw.utils.each(suffixes, function(m) {
			// Test pattern
			var match = m[0].exec(s);
			// Got a match?
			if(match) {
				// Call handler function
				m[1].call(this,match);
				// Consume
				s = s.substr(match[0].length);
				// Start over
				return false;
			}
		});
		// No match?
		if (s === was) {
			throw (error + "invalid suffix(es) '" + s + "'");
		}
	}
	exclude = $.exclude ? $tw.wiki.filterTiddlers($.exclude) : [];
	truncate = $.truncate ? $tw.wiki.filterTiddlers($.truncate) : [];
	getChildren($.root,0);
	return results;
	// Catch errors
	} catch (e) {
		return [error + e];
	}
};

})();