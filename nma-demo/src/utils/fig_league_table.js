'use strict';

export const fig_lgtable = {
    plot_id: '#fig_lgtable',
    plot_type: 'd3js',

    // for drawing
    data: null,
    fixed_or_random: 'fixed',

    // for d3.js
    svg: null,
    width: 500,
    height: 400,
    width_cell: 72,
    height_cell: 32,
    r_header: 0.5,
    font_size: 12,
    color_ctc: '#DFDFDF',
    color_border: 'whitesmoke',
    color_scale: d3.scaleLinear()
        .domain([0, 1, 2])
        .range(['#78b787', 'white', '#fb6464']),
    color_scale_lb: d3.scaleLinear()
            .domain([0, 1, 2])
            .range(['#78b787', 'white', '#fb6464']),
    color_scale_hb: d3.scaleLinear()
            .domain([0, 1, 2])
            .range(['#fb6464', 'white', '#78b787']),
    color_scale_range: [0, 0.9, 1, 1.1, 2],
    color_scale2: function(sm, lower, upper) {
        // there are 4 cases:
        if (sm > 1) {
            if (lower > 1 && upper > 1) {
                // return this.color_scale(hr>this.color_scale_range[3]?hr:this.color_scale_range[3]);
                return this.color_scale(2);
            } else {
                // return this.color_scale(this.color_scale_range[3]);
                return "#fb64642b";
            }

        } else if (sm < 1) {
            if (lower < 1 && upper < 1) {
                // return this.color_scale(hr<this.color_scale_range[1]?hr:this.color_scale_range[1]);
                return this.color_scale(0);
            } else {
                // return this.color_scale(this.color_scale_range[1]);
                return "#78b78745";
            }
        } else {
            return this.color_scale(this.color_scale_range[2])
        }
    },

    init: function() {
        this.svg = d3.select(this.plot_id);
        
        // init the tip
        this.tip = d3.tip()
            .attr('class', 'd3-tip')
            .direction('e')
            .offset([0,5])
            .html(function(d) {
                if (d.info == '') {
                    return null;
                }
                return d.info;
            });
        this.svg.call(this.tip);
    },
    
    clear: function() {
        this.svg.selectAll('*').remove();
        // hide
    },

    /**
     * Convert this.data to D3.js data format (list)
     */
    conv_table2list: function() {
        this.datalist = [];
        for (let i = 0; i < this.data.ds.n_treats; i++) {
            var row = this.data.ds.treats[i];
            for (let j = 0; j < this.data.ds.n_treats; j++) {
                var col = this.data.ds.treats[j];
                var val = this.data[this.fixed_or_random].SM[j][i];
                var lci = this.data[this.fixed_or_random].SM_lower[j][i];
                var uci = this.data[this.fixed_or_random].SM_upper[j][i];

                var info = '';
                if (i != j) {
                    info = '<table>' +
                            '<tr>' +
                                '<td colspan="2"><b>'+col+'</b> vs <b>'+row+'</b></td>' +
                            '</tr>' +
                            '<tr>' +
                                '<td>Effect: </td>' +
                                '<td>'+val.toFixed(2)+'</td>' +
                            '</tr>' +
                            '<tr>' +
                                '<td>95% CI: </td>' +
                                '<td>('+lci.toFixed(2)+', '+uci.toFixed(2)+')</td>' +
                            '</tr>' +
                        '</table>';                    
                }
                
                this.datalist.push({
                    i: i,
                    j: j,
                    row: row,
                    col: col,
                    val: val,
                    lci: lci,
                    uci: uci,
                    info: info
                });
            }
        }
    },

    draw: function(data) {
        // need to decide which is better here
        // the which is better may be provided by the 
        if (typeof(fm_config)!='undefined') {
            // which means we can get the config value from configure
            if (fm_config.vpp.cfgs.which_is_better.selected == 'small') {
                this.color_scale = this.color_scale_lb;
            } else {
                this.color_scale = this.color_scale_hb;
            }
        }

        this.clear();

        // bind and transform data
        this.data = data;
        this.conv_table2list();

        // show this box
        // $(this.box_id).show();

        // update the width and height of svg
        // + 1 is for the top+left header
        // + 0.5 is for the header name
        this.width = (this.data.ds.n_treats + 1 + 0.5) * this.width_cell;
        this.height = (this.data.ds.n_treats + 1 + 0.5) * this.height_cell;
        this.svg.attr('width', this.width)
            .attr('height', this.height);

        d3.select(this.svg.node().parentNode).style('width', this.width + 'px');
        d3.select(this.svg.node().parentNode).style('height', this.height + 'px');
        // update the box width
        // $(this.box_id).css('width', this.width);

        // get the values
        this._draw_header();

        // draw table
        var cells = this.svg.selectAll('g.cell')
            .data(this.datalist)
            .enter()
            .append('g')
            .attr('class', function(d, i) {
                if (d.i == d.j) {
                    return 'ctc';
                } else {
                    return 'cell';
                }
            })
            .attr('transform', function(d, i) {
                var cell_x = (fig_lgtable.r_header + 1 + d.j) * fig_lgtable.width_cell;
                var cell_y = (fig_lgtable.r_header * 2 + d.i) * fig_lgtable.height_cell;
                return 'translate('+cell_x+', '+cell_y+')'
            })
            .on('mouseover', this.tip.show)
            .on('mouseout', this.tip.hide);
            
        // unbind hover event of ctc
        this.svg.selectAll('g.ctc')
            .on('mouseover', null)
            .on('mouseout', null);

        // draw the cell background
        cells.append('rect')
            .attr('width', this.width_cell)
            .attr('height', this.height_cell)
            .attr('fill', function(d, i) {
                if (d.i == d.j) {
                    return fig_lgtable.color_ctc;
                } else {
                    return fig_lgtable.color_scale2(d.val, d.lci, d.uci);
                }
            })
            .attr('stroke', this.color_border);

        // draw the cell text
        var t_vals = cells.append('text')
            .attr('x', this.width_cell / 2)
            .attr('y', this.height_cell / 2)
            .attr('font-size', this.font_size)
            .attr('alignment-baseline', 'middle')
            .attr('text-anchor', 'middle');
        t_vals.append('tspan')
            .attr('x', this.width_cell / 2)
            .attr('y', this.height_cell / 2)
            .text(function(d, i) {
                if (d.i == d.j) {
                    return '';
                } else {
                    return d.val.toFixed(2);
                }
            });
        t_vals.append('tspan')
            .attr('x', this.width_cell / 2)
            .attr('y', this.height_cell / 2 + this.font_size)
            .text(function(d, i) { 
                if (d.i == d.j) {
                    return '';
                } else {
                    return '('+d.lci.toFixed(2)+', '+d.uci.toFixed(2)+')';
                }
            });
    },


    _draw_header: function() {
        var tmp_x = (this.r_header + 1 + this.data.ds.n_treats / 2) * this.width_cell;
        var tmp_y = (this.r_header * 0.5) * this.height_cell;
        var g_header = this.svg.append("g")
            .attr('class', 'header');
        g_header.append('text')
            .attr('x', tmp_x)
            .attr('y', tmp_y)
            .attr('font-size', this.font_size)
            .attr('text-anchor', 'middle')
            .attr('alignment-baseline', 'middle')
            .text('Treatments');
        g_header.append('line')
            .attr('x1', (this.r_header + 1) * this.width_cell)
            .attr('x2', (this.r_header + 1 + this.data.ds.n_treats) * this.width_cell)
            .attr('y1', (this.r_header) * this.height_cell)
            .attr('y2', (this.r_header) * this.height_cell)
            .attr('stroke', this.color_ctc);

        // draw the header column
        tmp_x = (this.r_header * 0.6) * this.width_cell;
        tmp_y = (this.r_header * 2 + this.data.ds.n_treats / 2) * this.height_cell;
        g_header.append('text')
            .attr('x', tmp_x)
            .attr('y', tmp_y)
            .attr('font-size', this.font_size)
            .attr('text-anchor', 'middle')
            .attr('transform', 'rotate(-90, '+tmp_x+', '+tmp_y+')')
            .text('Comparator');
        g_header.append('line')
            .attr('x1', (this.r_header) * this.width_cell)
            .attr('x2', (this.r_header) * this.width_cell)
            .attr('y1', (this.r_header * 2) * this.height_cell)
            .attr('y2', (this.r_header * 2 + this.data.ds.n_treats) * this.height_cell)
            .attr('stroke', this.color_ctc);

        // the the header texts of treatment
        for (let i = 0; i < this.data.ds.n_treats; i++) {
            var header = this.data.ds.treats[i];
            // in each col, 0.5 is the line middle
            tmp_x = (this.r_header + 1 + i + 0.5) * this.width_cell;
            tmp_y = (this.r_header * 1.5) * this.height_cell;
            g_header.append('text')
                .attr('x', tmp_x)
                .attr('y', tmp_y)
                .attr('font-size', this.font_size)
                .attr('text-anchor', 'middle')
                .attr('alignment-baseline', 'middle')
                .text(header);

            // in each row, this.font_size / 2 is similar to 0.5em
            // tmp_x = this.r_header * this.width_cell + this.font_size / 2;
            tmp_x = this.r_header * this.width_cell + this. width_cell - 9;
            tmp_y = (this.r_header * 2 + i + 0.5) * this.height_cell;
            g_header.append('text')
                .attr('x', tmp_x)
                .attr('y', tmp_y)
                .attr('font-size', this.font_size)
                .attr('text-anchor', 'end')
                .attr('alignment-baseline', 'middle')
                .text(header);
        }
    }
};