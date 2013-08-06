
//JQUERY EXTENSION
// AUTO COMPLETE COMBOBOX
(function( $ ) {
    $.widget( "custom.combobox", {
        _create: function() {
            this.wrapper = $( "<span>" )
                .addClass( "custom-combobox" )
                .insertAfter( this.element );

            this.element.hide();
            this._createAutocomplete();
            this._createShowAllButton();
        },
    _createAutocomplete: function() {
        var selected = this.element.children( ":selected" ),
            value = selected.val() ? selected.text() : "";
        this.input = $( "<input>" )
            .appendTo( this.wrapper )
            .val( value )
            .addClass( "custom-combobox-input ui-widget ui-widget-content ui-state-default ui-corner-left" )
            .autocomplete({
                delay: 0,
                minLength: 0,
                source: $.proxy( this, "_source" )
            })
            .attr('title'      , this.element.attr('title'      )) //SAULO. SHOW TOOLTIP
            .attr('placeholder', this.element.attr('placeholder')) //SAULO. SHOW PLACEHOLDER
            .tooltip({
                tooltipClass: "ui-state-highlight"
            });
        this._on( this.input, {
            autocompleteselect: function( event, ui ) {
                ui.item.option.selected = true;
                this._trigger( "select", event, {
                    item: ui.item.option
                });
                //SAULO: ONLY NEEDS TO CHECK FOR THE on select IN THE MAIN SELECT
                this.element.trigger("select");
            },
            autocompletechange: "_removeIfInvalid"
        });
    },
    _createShowAllButton: function() {
        var input = this.input,
        wasOpen = false;
        $( "<a>" )
            .attr( "tabIndex", -1 )
            .attr( "title", "Show All Items" )
            .tooltip()
            .appendTo( this.wrapper )
            .button({
                icons: {
                    primary: "ui-icon-triangle-1-s"
                },
                text: false
            })
            .removeClass( "ui-corner-all" )
            .addClass( "custom-combobox-toggle ui-corner-right" )
            .mousedown(function() {
                wasOpen = input.autocomplete( "widget" ).is( ":visible" );
            })
            .click(function() {
                input.focus();
                // Close if already visible
                if ( wasOpen ) {
                    return;
                }
                // Pass empty string as value to search for, displaying all results
                input.autocomplete( "search", "" );
            });
        },
    _source: function( request, response ) {
        var matcher = new RegExp( $.ui.autocomplete.escapeRegex(request.term), "i" );
        response( this.element.children( "option" ).map(function() {
            var text = $( this ).text();
            if ( this.value && ( !request.term || matcher.test(text) ) ) {
                return {
                    label: text,
                    value: text,
                    option: this
                };
            } else {
                return null;
            }
        }) );
    },
    _removeIfInvalid: function( event, ui ) {
        // Selected an item, nothing to do
        if ( ui.item ) {
            return;
        }
        // Search for a match (case-insensitive)
        var value = this.input.val(),
        valueLowerCase = value.toLowerCase(),
        valid = false;
        this.element.children( "option" ).each(function() {
            if ( $( this ).text().toLowerCase() === valueLowerCase ) {
                this.selected = valid = true;
                return false;
            } else {
                return null;
            }
        });
        // Found a match, nothing to do
        if ( valid ) {
            return;
        }
        // Remove invalid value
        this.input
            .val( "" )
            .attr( "title", value + " didn't match any item" )
            .tooltip( "open" );
        this.element.val( "" );
        this._delay(function() {
            this.input.tooltip( "close" ).attr( "title", "" );
            }, 2500
        );
        this.input.data( "ui-autocomplete" ).term = "";
    },
    _destroy: function() {
        this.wrapper.remove();
        this.element.show();
    }
    });
})( jQuery );
















// GLOBAL VARIABLES
var num_groups   = 30;
var GraphDiv     = "display";
var TreeDiv      = 'svgDisplay';
var maxW         = $(window).width()  *.8;
var maxH         = $(window).height() *.8;

// GLOBAL STATE
var printHeader  = false;
var printspecies = false;
var outD3        = false;


// GRAPH COLOR SCHEME: RED
var yr = 253; //red
var yg =  32; //green
var yb = 117; //blue


$(document).ready(function(){
    //FORMATING DIVS
    $('<div>'       , { 'class': 'row'                  , 'id': 'main_row'     } ).appendTo('#wrap'      );
    $('<div>'       , { 'class': 'span12'               , 'id': 'main_col'     } ).appendTo('#main_row'  );
    $('<div>'       , { 'class': 'row'                  , 'id': 'head_row_1'   } ).appendTo('#main_col'  );
    $('<div>'       , { 'class': 'span2'                , 'id': 'head_row_1_1' } ).appendTo('#head_row_1');
    $('<div>'       , { 'class': 'span2 offset1'        , 'id': 'head_row_1_2' } ).appendTo('#head_row_1');
    $('<div>'       , { 'class': 'span2 offset1'        , 'id': 'head_row_1_3' } ).appendTo('#head_row_1');
    $('<div>'       , { 'class': 'span2'                , 'id': 'head_row_1_4' } ).appendTo('#head_row_1');



    //DYNAMIC SELECTS
    $('<select>'    , { 'class': 'sel span3'            , 'id': 'sel_spp'      } )
    .attr('title', 'Species for reference')
    .appendTo('#head_row_1_1');

    $('<select>'    , { 'class': 'sel span3'            , 'id': 'sel_chr'      } )
    .attr('title', 'Chromosome'           )
    .appendTo('#head_row_1_1');

    $('<select>'    , { 'class': 'sel span3'            , 'id': 'sel_gene', 'disabled': true} )
    .attr('title'      , 'Select a Individual Gene to Visualize' )
    .attr('placeholder', 'Select a Individual Gene'              )
    .appendTo('#head_row_1_1');




    //SELECT CLUSTERING
    var clusterSel   = $('<select>'     , { 'class': 'sel span3'            , 'id': 'sel_cluster', 'tgt' : 'clusterVal',                                                'title': 'Clustering by N base pairs, N groups or evenly distributed' }).appendTo('#head_row_1_2');
    var clusterInput = $('<input>'      , { 'class': 'inp numbersOnly span3', 'id': 'clusterVal' , 'type': 'text', 'placeholder': 'clustering value', 'disabled': true, 'title': 'Clustering Value'}).appendTo('#head_row_1_2');
    var opts         =  [
                            ['- Group by -'      , 'none'   ],
                            ['Group by N bp'     , 'group'  ],
                            ['Group by N classes', 'classes'],
                            ['Group evenly'      , 'evenly' ]
                        ];
    for (var oindex  = 0; oindex < opts.length; ++oindex) {
        var optName  = opts[oindex][0];
        var optVal   = opts[oindex][1];
        var divBtnLi = $('<option>', { 'class': 'clusteropt', 'value': optVal })
                        .text(optName)
                        .appendTo(clusterSel);
    }




    //SHOW HEADERS
    $('<label>'    , { 'class': 'lab lab_chk span2 pull-left'  , 'id': 'lab_printHeader',                    } ).appendTo('#head_row_1_3');
    $('<input>'    , { 'class': 'chk'                          , 'id': 'chk_printHeader', 'type': 'checkbox' } ).appendTo('#lab_printHeader');
    $('#lab_printHeader').append('Show Header' ).attr('title', 'Show Header' );


    //SHOW SPECIES
    $('<label>'    , { 'class': 'lab lab_chk span2 pull-left'  , 'id': 'lab_printSpp'                        } ).appendTo('#head_row_1_3');
    $('<input>'    , { 'class': 'chk'                          , 'id': 'chk_printSpp'   , 'type': 'checkbox' } ).appendTo('#lab_printSpp');
    $('#lab_printSpp'   ).append('Show Species').attr('title', 'Show Species');


    //MAX NUMBER OF ENTRIES
    $('<input>'      , { 'class': 'inp numbersOnly span2', 'id': 'maxNumber'     , 'type': 'text', 'disabled': true, 'placeholder': 'Max number of columns', 'title': 'Maximum number of columns to display. More than 300 is dangerous'}).appendTo('#head_row_1_3');


    //BUTTON
    $('<input>'    , { 'class': 'btn btn-primary btn-large btn-block pull-right span3', 'id': 'btn_send', 'type': 'button' } ).val('Send').appendTo('#head_row_1_4');
    $('#btn_send'       ).attr('title', 'Send Query');


    //COLOR PICKER
    $('<span>'     , { 'class': 'badge badge-info      colorchanger', 'color': 'blue'  , 'title': 'Blue'   }).html('B').appendTo('#head_row_1_4');
    $('<span>'     , { 'class': 'badge badge-success   colorchanger', 'color': 'green' , 'title': 'Green'  }).html('G').appendTo('#head_row_1_4');
    $('<span>'     , { 'class': 'badge                 colorchanger', 'color': 'grey'  , 'title': 'Grey'   }).html('G').appendTo('#head_row_1_4');
    $('<span>'     , { 'class': 'badge badge-important colorchanger', 'color': 'red'   , 'title': 'Red'    }).html('R').appendTo('#head_row_1_4');
    $('<span>'     , { 'class': 'badge badge-warning   colorchanger', 'color': 'yellow', 'title': 'Yellow' }).html('Y').appendTo('#head_row_1_4');
    $('<i>'        , { 'class': 'icon icon-info-sign'      , 'title': 'Help'}).click(showhelp).appendTo( '#head_row_1_4' );


    //RESPONSE DIV
    $('<div>'      , { 'class': 'display', 'id': GraphDiv } ).insertAfter('#main_row');
    $('<hr>'      ).insertBefore('#'+GraphDiv);
    $('<hr>'      ).insertAfter( '#'+GraphDiv);


    //TREE DIV
    $('<div>'      , { 'class': 'tree', 'id': TreeDiv } ).insertAfter('#main_row');
    $('#'+TreeDiv).dialog({ autoOpen: false, 'maxWidth': maxW, 'width': maxW, 'maxHeight': maxH, 'height': maxH });




    //TOOLTIP
    $('body').tooltip({
        content: function(callback){
            //$('.ui-tooltip').each(function(){ $(this).remove(); });
            var tools = document.getElementsByClassName('ui-tooltip');
            for ( var i=0; i<tools.length; i++) {
                $(tools[i]).remove();
            }

            if ( $(this).is('#data td.datacell') ) {
                callback( getCellTitle(this) );
            } else {
                callback( $(this).attr('title') ) ;
            }
        },
        show: { delay: 1300 }
    });




    //GLOBAL SELECTORS
    $(document).on('change',     '#sel_chr'          , function(){
        var sel = $(this).val();

        console.log('selected chromosome '+sel);

        $.getJSON('/genes/'+sel, function(data) {
            var selg = $('#sel_gene')
            .attr('disabled', true)
            .data('chrom', sel)
            .html('')
            .combobox();

            //selg.append($('<option>').attr('value', "").text("Select one..."));

            $.each(data['genes'], function() {
                selg.append($('<option>').attr('value', this).text(this));
            });

            $(selg).attr('disabled', false);
        });
    });


    $(document).on('select',     '#sel_gene'         , function(){
        var gene  = $(this).val();
        var chrom = $(this).data('chrom');
        console.log('selected gene '+gene+' for chrom '+chrom);

        $.getJSON('/report/'+chrom+'/'+gene, loadReport);
    });


    $(document).on('change',     '#sel_cluster'      , function(){
        var opt = $(this).val();
        var tgt = $(this).attr('tgt'  );
        console.log('selected option '+opt+' target '+tgt);
        if ((opt == 'evenly') || (opt == 'none')){
            $('#'+tgt).attr('disabled', true);
        }else{
            $('#'+tgt).attr('disabled', false);
        }
    });


    $(document).on('click',      '.colorchanger'     , function(){
        var color = $(this).attr('color');
        console.log('color '+color);
        mapColor(color);
    });


    $(document).on('click',      '#chk_printHeader'  , function(){
        $('.datath').each(function(){
            $(this).toggleClass('thinvisible');
        });
    });


    $(document).on('click',      '#chk_printSpp'     , function(){
        $('.datarow').each(function(){
            $(this).toggleClass('tdinvisible');
        });
    });


    $(document).on('keyup',      '.numbersOnly'      , function(){
        this.value = this.value.replace(/[^0-9]/g,'');
    });


    $(document).on('click',      'input[id=btn_send]', function(){
        var spp         = $('#sel_spp'    ).val();
        var chrom       = $('#sel_chr'    ).val();
        var clusterType = $('#sel_cluster').val();
        var clusterVal  = $('#clusterVal' ).val();

        var qry         = {};


        var slvals  = getSliderValue();
        var slmin   = slvals[0];
        var slmind  = slvals[1];
        var slmax   = slvals[2];
        var slmaxd  = slvals[3];
        var changed = slvals[4];
        console.log('got: min ',slmin,' mind ',slmind,' max ',slmax, ' maxd ',slmaxd, ' changed ', changed);

        if ( changed ) {
            console.log('changed');
            if (slmin != slmind) {
                console.log('sending start ', slmin);
                qry['startPos'] = slmin;
            }
            if (slmax != slmaxd) {
                console.log('sending end '  , slmax);
                qry['endPos'  ] = slmax;
            }
        }

        if ( clusterType != 'none'   )
        {
            qry[clusterType] = clusterVal;
        };

        //TODO: implement max number
        //var maxNumber  = $('#'+maxNumber).val();
        //var maxNumberD = $('#'+maxNumber).data('default');

        //if (( maxNumber !== null ) && ( maxNumber !== '' )) {
            //if (  maxNumber != maxNumberD ) {
                //qry[ 'maxNumber' ] = maxNumber;
            //}
        //}

        submitDataQuery(spp, chrom, qry);
    });


    $(document).on('click',      '#data td.datacell' , function(){
        var request  = $('#data').data('request');
        var evenly   = request[ 'evenly'  ] || null;
        var every    = request[ 'every'   ] || null;
        var nclasses = request[ 'nclasses'] || null;
        var chrom    = request[ 'chrom'   ] || null;


        if ( (!evenly)  && every === null && nclasses === null ) {
            var gene  = $(this).data(  'cname');
            var href = '/tree/'+chrom+'/'+gene;
            console.log('getting tree: '+href);
            $.getJSON(href, showTreePopUp);

        } else {
            var actstr = ""
            if ( evenly            ) { actstr += ' evenly' };
            if ( every    !== null ) { actstr += ' every ' + every    + ' bp'      };
            if ( nclasses !== null ) { actstr += ' in '    + nclasses + ' classes' };
            alert('I can only show tree without concatenations (evenly, every or classes). Currently you have '+actstr+' active');
        }
    });


    $(document).on('mouseenter', '#data td.datacell' , colorCrux);


    $(document).on('mouseleave', '#data td.datacell' , colorCrux);


    $(document).on('click'     , '.iconControl'      , posChanger);




    //LOADING DATA
    $.getJSON('/spps'  , function(data) {
        var sel = $('#sel_spp');
        $.each(data['spps'], function() {
            sel.append($('<option>').data('value', this).text(this));
        });
    });


    $.getJSON('/chroms', function(data) {
        var sel = $('#sel_chr');
        $.each(data['chroms'], function() {
            sel.append($('<option>').data('value', this).text(this));
        });
        $(sel).trigger('change');
    });


    $.getJSON('/mtime', function(data) {
        console.log('mtime '+data)
        $('#dbmtime').html(data['mtime']);
    });







    //FUNCTIONS
    function submitDataQuery(spp, chrom, qry) {
        var href    = '/data/' + spp + '/' + chrom + '?' + $.param(qry);
        console.log(qry);
        console.log('getting data from url: ' + href);

        $('#'+GraphDiv).html('<span class="label label-important" id="lbl_status">Downloading '+href+'</span><i class="icon-spinner icon-spin">');

        console.log('getting data');

        $.ajax({
            url: href,
            success: loadData,
            dataType: "text"
        });
        //$.getJSON(href, loadData);

        console.log('request sent');
    }


    function colorCrux(){
        var rname = $.data(this, 'rname');
        var cname = $.data(this, 'cname');


        //$('#data tr[rname='+rname+']').each(function(){ $(this).toggleClass('coloredRow') });

        //var cellIndex = $(this)[0].cellIndex;
        //$('#data tr').each(function(){ $(this).find('td').eq(cellIndex).toggleClass('coloredCol').toggleClass('datatd'); });
        //$('#data td[cname="'+cname+'"]').each( function() { $(this).toggleClass('coloredCol').toggleClass('datatd'); } );

        rnames = document.querySelectorAll('#data tr[rname="'+rname+'"]');
        for (var i = 0; i<rnames.length; ++i){
            rnames[i].classList.toggle('coloredRow');
        }


        cnames = document.querySelectorAll('#data td[cname="'+cname+'"]');
        for (var i = 0; i<cnames.length; ++i){
            cnames[i].classList.toggle('coloredCol');
            cnames[i].classList.toggle('datatd');
        }


        //$(this).toggleClass('datatd');

        //$('.ui-tooltip').each(function(){ $(this).remove(); });
        var tools = document.getElementsByClassName('ui-tooltip');
        for ( var i=0; i<tools.length; i++) {
            $(tools[i]).remove();
        }
    };


    function loadReport(data) {
        console.log('got report data');
        $('#'+GraphDiv).html('<span class="label label-warning" id="lbl_status">Processing</span>');
        console.log('separating data');
        var start   = data['START'  ];
        var end     = data['END'    ];
        var name    = data['NAME'   ];
        var lenObj  = data['LEN_OBJ'];
        var lenSnp  = data['LEN_SNP'];
        var gene    = data['gene'   ];
        var chrom   = data['chrom'  ];

        var spps    = data['spps'   ];
        var matrix  = data['LINE'   ];

        var treeStr = data['TREE'   ];

        var aln     = data['FASTA'  ];


        $('<table>', { 'class': 'table table-stripped table-condensed reportTable', 'id': 'reportTable' }).appendTo('#'+GraphDiv);

        var rtable  = $('#reportTable');

        var pairs = [
                        [ 'Start'      , start   ],
                        [ 'End'        , end     ],
                        [ 'Name'       , name    ],
                        [ '# Objects'  , lenObj  ],
                        [ '# SNPs'     , lenSnp  ],
                        [ 'Object Name', gene    ],
                        [ 'Chromosome' , chrom   ],
                    ];

        var trs     = new Array(pairs.length + 3);

        for ( ppos = 0; ppos < pairs.length; ++ppos ) {
            var pval = pairs[ppos];
            trs[ppos] = $('<tr>', {'class': 'reportLine'})
                            .append( $('<td>', { 'class': 'reportCell reportHeader' }).html( pval[0] ) )
                            .append( $('<td>', { 'class': 'reportCell reportVal'    }).html( pval[1] ) );
        }

        var treeDst   = 'treeDst';
        var matrixDst = 'matrixDst';
        var alnDst    = 'alignmentDst';
        trs[pairs.length + 0] = $('<tr>', {'class': 'reportLine'}).append( $('<td>', { 'class': 'reportCell reportHeader' }).html('Tree'     ) ).append( $('<td>', { 'class': 'reportCell reportVal' }).append( $('<div>', { 'id': treeDst   } ) ) );
        trs[pairs.length + 1] = $('<tr>', {'class': 'reportLine'}).append( $('<td>', { 'class': 'reportCell reportHeader' }).html('Alignment') ).append( $('<td>', { 'class': 'reportCell reportVal' }).append( $('<div>', { 'id': alnDst    } ) ) );
        trs[pairs.length + 2] = $('<tr>', {'class': 'reportLine'}).append( $('<td>', { 'class': 'reportCell reportHeader' }).html('Matrix'   ) ).append( $('<td>', { 'class': 'reportCell reportVal' }).append( $('<div>', { 'id': matrixDst } ) ) );

        rtable.append(trs);

        showTree(      { 'chrom': chrom, 'gene': gene, 'tree': treeStr}, treeDst);
        showMatrix(    spps, matrix, matrixDst );
        showAlignment( spps, aln   , alnDst    );

        $('#lbl_status').remove();
    }


    function loadData(data) {
        console.log('got data');
        console.log('parsing');
        data = JSON.parse(data);
        console.log('parsed');
        //console.log(data);
        //return;
        var tgt = ('#'+GraphDiv);
        $(tgt).html('<span class="label label-warning" id="lbl_status">Processing</span>');
        console.log('separating data');

        var request        = data[      'request'        ];
        var header         = data[      'header'         ];
        var data_line      = data[      'data'           ];
        var data_info      = data[      'data_info'      ];

        var line_starts    = header[    'start'          ];
        var line_ends      = header[    'end'            ];
        var line_unities   = header[    'num_unities'    ];
        var line_snps      = header[    'num_snps'       ];
        var line_names     = header[    'name'           ];

        var ddata          = data_line[ 'line'           ];
        var dnames         = data_line[ 'name'           ];

        var dminPos        = data_info[ 'minPos'         ];
        var dmaxPos        = data_info[ 'maxPos'         ];
        var dminPosAbs     = data_info[ 'minPosAbs'      ];
        var dmaxPosAbs     = data_info[ 'maxPosAbs'      ];

        var dmin           = data_info[ 'minVal'         ];
        var dmax           = data_info[ 'maxVal'         ];
        var num_rows       = data_info[ 'num_rows'       ];
        var num_cols       = data_info[ 'num_cols'       ];
        var num_cols_total = data_info[ 'num_cols_total' ];

        //console.log(data_info);
        console.log('adding structures');

        var resStr   = 'Start: ' + dminPos + ' bp (out of '+dminPosAbs+' bp) End: ' + dmaxPos + ' bp (out of '+dmaxPosAbs+' bp) ' + ' min value: ' + dmin + ' max value: ' + dmax + ' species: '+ num_rows + ' unities: '+num_cols+' (out of '+num_cols_total+')';
        var qryStr   = '';
        var evenly   = request['evenly'  ];
        var every    = request['every'   ];
        var nclasses = request['nclasses'];
        var chrom    = request['chrom'   ];

        if (   evenly             ) { qryStr += ' evenly;'                         };
        if (   every     !== null ) { qryStr += ' every ' + every    + ' bp;'      };
        if (   nclasses  !== null ) { qryStr += ' in '    + nclasses + ' classes;' };


        $('<span>' , { 'class': "label label-success", 'id': "lbl_resstatus" }).html( resStr ).appendTo( tgt );
        $('<span>' , { 'class': "label"              , 'id': "lbl_qrystatus" }).html( qryStr ).appendTo( tgt );


        $('<div>'  , { 'class': 'pull-right span4', 'id': 'posControl' }).appendTo( tgt );

        $('<i>'    , { 'class': 'iconControl icon-refresh'      , 'title': 'Whole Genome'   }).data('dst', 'refresh' ).appendTo( '#posControl' );
        $('<i>'    , { 'class': 'iconControl icon-fast-backward', 'title': 'First Block'    }).data('dst', 'first'   ).appendTo( '#posControl' );
        $('<i>'    , { 'class': 'iconControl icon-step-backward', 'title': 'Previous Block' }).data('dst', 'previous').appendTo( '#posControl' );

        $('<input>', { 'class': 'span3'                         , 'id': 'sliderLbl', 'type': 'text' }).appendTo( '#posControl' );

        $('<i>'    , { 'class': 'iconControl icon-step-forward' , 'title': 'Next Block'     }).data('dst', 'next'    ).appendTo( '#posControl' );
        $('<i>'    , { 'class': 'iconControl icon-fast-forward' , 'title': 'Last Block'     }).data('dst', 'last'    ).appendTo( '#posControl' );

        $('<hr>'      ).appendTo( tgt );

        $('<div>'  , { 'id': 'slider'}).data({'minPosDefault': dminPosAbs, 'maxPosDefault': dmaxPosAbs}).appendTo( tgt );

        $('<hr>'      ).appendTo( tgt );



        console.log('adding slider');
        $('#slider').slider({
            range: true,
            min: dminPosAbs,
            max: dmaxPosAbs,
            step: 1,
            values: [dminPos, dmaxPos],
            slide: function( event, ui ) {
                var page = $('#data').data('request')['page'] || null;

                if ( page !== null ) { page = page + 1; } else { page = 1; };

                lengAbs = $('#data').data('data_info')["length_abs"];
                //console.log('length abs '+lengAbs);
                step    = Math.floor( lengAbs / 100 );
                //console.log('step '+step);
                ui.step = step;

                $("#sliderLbl").val("From "+ui.values[0]+ " To "+ui.values[1] + " Page " + page );


            }
        });


        var page = request['page'];
        if ( page !== null ) { page = page + 1; } else { page = 1; };

        $("#sliderLbl")
            .val("From "+$("#slider").slider("values", 0)+ " To "+$("#slider").slider("values", 1) + " Page " + page)
            .attr('disabled', true)
            .attr('title', 'Show only this range');




        if ( ! outD3 ) {
            console.log('NO D3');
            console.log('adding table');
            //metadata['id'] = "data";

            var $tbl = $('<table>', { 'id': "data" });

            var requestF = {};
            $.each(request, function(k,v){
                if (( v !== null ) && ( v !== false )) {
                    console.log('table adding k: '+k+' v '+v);
                    requestF[k] = v;
                }
            });
            $tbl.data('request'  , requestF);
            $tbl.data('data_info', data_info);

            console.log('adding header');
            var $trStart = addRowHeader('Start Position', 'play'    , line_names, line_starts );
            var $trEnd   = addRowHeader('End   Position', 'stop'    , line_names, line_ends   );
            var $trUnit  = addRowHeader('# Unities'     , 'th-large', line_names, line_unities);
            var $trSnp   = addRowHeader('# SNPs'        , 'star'    , line_names, line_snps   );
            var $trName  = addRowHeader('Unity Name'    , 'user'    , line_names, line_names  );

            var rows = new Array(ddata.length + 5);
            rows[0] = $trStart;
            rows[1] = $trEnd;
            rows[2] = $trUnit;
            rows[3] = $trSnp;
            rows[4] = $trName;

            console.log('adding rows');

            $.each(ddata, function(dindex) {
                var dname = dnames[dindex];
                var $tr   = addRowData(  dname, line_starts, line_ends, line_unities, line_snps, line_names, this );
                rows[dindex + 5 ] = $tr;
            });

            console.log('adding to table');
            $tbl.append( rows );
            $tbl.appendTo(tgt)

            console.log('coloring');
            heatMap();
            console.log('done');

        } else {
            plotSVG(num_cols, num_rows, dmin, dmax, ddata, line_names, dnames, tgt);
        }

        console.log('cleaning memory');
        data         = null;
        header       = null;
        line_starts  = null;
        line_ends    = null;
        line_unities = null;
        line_snps    = null;
        line_names   = null;

        data_info    = null;
        ddata        = null;
        dnames       = null;
        dmin         = null;
        dmax         = null;
        num_rows     = null;
        num_cols     = null;

        $('#lbl_status').remove();
        console.log('finished');

        //http://www.designchemical.com/blog/index.php/jquery/jquery-tutorial-create-a-flexible-data-heat-map/
    }


    function addRowHeader(name, icon, line_names, data) {
        var $tr  = $('<tr>');

        var $tdh  = $('<th>').attr('class', 'datath dataheader').data('rname', name).text(name);
        var cells = new Array(data.length+1);
        if ( ! $("#chk_printHeader").is(':checked') ) {
            $tdh.addClass('thinvisible');
        }
        cells[0] = $tdh;

        $.each(data, function(index) {
            var cname  = line_names[   index ];
            var val    = data[ index ];
            var $td    = $('<th>').attr('class', 'datath dataheadercell').attr('title', this).data('cname', cname).text(val);
            //$td.append( $('<i>').attr('class', 'icon-'+icon) )
            if ( ! $("#chk_printHeader").is(':checked') ) {
                $td.addClass('thinvisible');
            }
            cells[index + 1] = $td;
        });

        $tr.append( cells );
        return $tr;
    }


    function addRowData(rname, line_starts, line_ends, line_unities, line_snps, line_names, data) {
        var $tr   = $('<tr>').attr('rname', rname).data('rname', rname);

        var cells = new Array(data.length + 1);
        var $td   = $('<td>').attr('class', 'datatd datarow').data('rname', rname).text(rname);

        if ( ! $("#chk_printSpp").is(':checked') ) {
            $td.addClass('tdinvisible');
        }

        cells[0] = $td;

        for (var index=0; index < data.length; ++index){
        //$.each(data, function( index ) {
            //var distance = this[0];
            //var rownum   = this[1];
            //var colnum   = this[2];
            var datal    = data[index];
            var distance = datal[0];
            var rownum   = datal[1];
            var colnum   = datal[2];

            var cstart   = line_starts[  index ];
            var cend     = line_ends[    index ];
            var cuni     = line_unities[ index ];
            var csnp     = line_snps[    index ];
            var cname    = line_names[   index ];

            var ctitle   = '';//'Species: ' + rname + ' Name: ' + cname + ' Start: ' + cstart + ' End: ' + cend + ' Unities: ' + cuni + ' SNPs: ' + csnp + ' Distance: '+ distance + ' Rownum ' + rownum + ' Colnum ' + colnum;

            var $tdd      = $('<td>')
                .data({
                            'rname'  : rname   ,
                            'cname'  : cname   ,
                            'value'  : distance,

                            'start'  : cstart  ,
                            'end'    : cend    ,
                            'unities': cuni    ,
                            'snps'   : csnp    ,
                            'name'   : cname
                        });
            $($tdd)[0].setAttribute('class', 'datatd datacell');
            $($tdd)[0].setAttribute('cname', cname            );
            $($tdd)[0].setAttribute('title', ''               );


            //console.log('rname '+$.data($td, 'rname')+' cname '+$.data($td, 'cname')+' value '+$.data($td, 'value'));
            cells[index + 1] = $tdd;
        //});
        }

        $tr.append( cells );

        return $tr;
    }


    function getCellTitle(cell) {
        var rname    = $(cell).data('rname'  );
        var cname    = $(cell).data('cname'  );
        var distance = $(cell).data('value'  );

        var cstart   = $(cell).data('start'  );
        var cend     = $(cell).data('end'    );
        var cuni     = $(cell).data('unities');
        var csnp     = $(cell).data('snps'   );
        var cname    = $(cell).data('name'   );

        var title = '<p class="ptip"><b>Species:</b> ' + rname + '<p class="ptip"><b>Name:</b> ' + cname + '<p class="ptip"><b>Start:</b> ' + cstart + '<p class="ptip"><b>End:</b> ' + cend + '<p class="ptip"><b>Unities:</b> ' + cuni + '<p class="ptip"><b>SNPs:</b> ' + csnp + '<p class="ptip"><b>Distance:</b> '+ distance; // + ' Rownum ' + rownum + ' Colnum ' + colnum

        return title;
    }


    function mapColor(color){
        switch(color)
            {
                case 'blue':
                    yr = 52;
                    yg = 119;
                    yb = 220;
                    break;
                case 'yellow':
                    yr = 250;
                    yg = 237;
                    yb = 37;
                    break;
                case 'green':
                    yr = 118;
                    yg = 246;
                    yb = 68;
                    break;
                case 'grey':
                    yr = 100;
                    yg = 100;
                    yb = 100;
                    break;
                case 'red':
                    yr = 253;
                    yg =  32;
                    yb = 117;
                    break;
                default:
                    yr = 243;
                    yg = 32;
                    yb = 117;
                    break;
            }
        heatMap();
    }


    function heatMap(){
        // Function to get the Max value in Array
        //Array.max = function( array ){
        //    return Math.max.apply( Math, array );
        //};

        // get all values
        //var counts = $('#data td.datacell').map(function() {
            //cval = $.data(this, 'value');
            //return parseFloat(cval);
        //}).get();

        // return max value
        //var max = Array.max(counts);

        var max = $('#data').data('data_info')["maxVal"];
        xr = 255;
        xg = 255;
        xb = 255;
        //n  = 100;

        // add classes to cells based on nearest 10 value
        var pieces = document.getElementsByClassName('datacell');
        for ( var i=0; i<pieces.length; i++) {
        //$('#data td.datacell').each(function(){
            var piece = pieces[i];
            var val   = $.data(piece, 'value');
            //var val   = $.data(this, 'value');

            var pos   = parseInt((Math.round((val/max)*100)).toFixed(0));
            var red   = parseInt((xr + (( pos * (yr - xr)) / (num_groups-1))).toFixed(0));
            var green = parseInt((xg + (( pos * (yg - xg)) / (num_groups-1))).toFixed(0));
            var blue  = parseInt((xb + (( pos * (yb - xb)) / (num_groups-1))).toFixed(0));
            var clr   = 'rgb('+red+','+green+','+blue+')';

            //console.log('val ' + val + ' max ' + max + ' pos ' + pos + ' R ' + red + ' G ' + green + ' B ' + blue + ' clr ' + clr);

            //$(this).css({backgroundColor:clr});
            //$(this)[0].style.backgroundColor = clr;
            piece.style.backgroundColor = clr;
        //});
        }
    }


    function showTreePopUp(treeData){
        showTree(treeData, TreeDiv);
        console.log('opening');
        $('#'+TreeDiv).dialog('open');
    }


    function showTree(treeData, dst){
        console.log('showing tree');

        var chrom   = treeData['chrom'];
        var gene    = treeData['gene' ];
        var treeStr = treeData['tree' ];

        $('#tree').html('');
        $('#'+dst).html('');

        $('<div>', {'id': 'tree'}).appendTo('#'+dst);


        //Smits.PhyloCanvas.Render.Style['text']['font-size'] = 10;
        //Smits.PhyloCanvas.Render.Style['Rectangular']['bufferX'] = 200;
        console.log('creating');
        console.log(treeStr);
        var phylocanvas = new Smits.PhyloCanvas(
            {'newick': treeStr},   // Newick or XML string
            'tree',       // div id where to render
            maxH * 2.0, // height, in pixels
            maxW * 0.8, // width in pixels
            'rectangular'
            //'circular'
        );
        console.log('created');

        console.log('adding data');
        $('#tree').data('phylo', phylocanvas);

        var nfile  = chrom+'_'+gene+'.tree';
        $('<a>', {'ofile': nfile}).data('src', treeStr).data('filetype', "text/plain").text('Download Phylip').click(downloadData).insertAfter('#tree');

        var ofile  = chrom+'_'+gene+'.svg';
        var svgSrc = phylocanvas.getSvgSource();
        $('<a>', {'ofile': ofile}).data('src', svgSrc).data('filetype', "image/svg+xml").text('Download SVG').click(downloadData).insertAfter('#tree');
    }


    function downloadData() {
        var ofile     = $(this).data('ofile'   );
        var dataobj   = $(this).data('src'     );
        var datatype  = $(this).data('filetype');

        var blob      = new Blob([dataobj], {type: datatype});
        saveAs(blob, ofile);
    }


    function showMatrix(    spps, matrix, matrixDst ) {
        var $dst = $('#'+matrixDst);
        var $tbl = $('<table>', { 'class': 'matrixTable' }).appendTo($dst);

        $.each( spps, function (k,v) {
            //console.log('matrix k '+k+' v '+v);
            var $tr  = $('<tr>', {'class': 'matrixLine'             }).appendTo($tbl);
            $tr.append($('<td>', {'class': 'matrixCell matrixHeader'}).append(v));

            $.each( matrix[k], function (l,col) {
                if ( l == k ) {
                    $td = $('<td>', {'class': 'matrixCell matrixVal matrixDiagonal'}).append(col).appendTo($tr);

                } else if ( l > k ) {
                    $td = $('<td>', {'class': 'matrixCell matrixVal matrixParallel'}).append(col).appendTo($tr);

                } else {
                    $td = $('<td>', {'class': 'matrixCell matrixVal matrixMain'    }).append(col).appendTo($tr);
                }
                //console.log('aln '+k+' v '+v);
            });
        });
    }


    function showAlignment( spps, aln, alnDst ) {
        var $dst = $('#'+alnDst);
        var $tbl = $('<table>', { 'class': 'alignmentTable'}).appendTo($dst);

        $.each( spps, function (k,v) {
            var seq  = aln[v];
            //console.log('aln    k '+k+' v '+v+' seq '+seq);
            var $tr  =  $('<tr>', { 'class': 'alignmentCell alignmentLine'         })
                .append($('<td>', { 'class': 'alignmentCell alignmentHead'         }).append(v  ))
                .append($('<td>', { 'class': 'monospace alignmentCell alignmentVal'}).append(seq))
                .appendTo($tbl);
            //console.log('aln '+k+' v '+v);
        });

        $('.alignmentVal').each(function(){
            var message = $(this).html();
            var chars   = new Array( message.length );
            for (var i  = 0; i < message.length; i++) {
                var mchar = message[i];
                chars[i] = "<div class='dnaNuc dna"+mchar+"'>" + mchar + "</span>";
            }
            $(this).html(chars);
        });
    }


    function getSliderValue() {
        if ( $("#slider").length > 0 ) {
            console.log('has slider');
            var slider = $("#slider");
            var slmin  = $(slider).slider("values", 0);
            var slmax  = $(slider).slider("values", 1);
            var slmind = $(slider).data('minPosDefault');
            var slmaxd = $(slider).data('maxPosDefault');


            var changed = true;
            if ((slmin == slmind) && (slmax == slmaxd)){
                changed = false;
            }

            console.log('getting value: min ',slmin,' mind ',slmind,' max ',slmax, ' maxd ',slmaxd, ' changed ', changed);

            return [slmin, slmind, slmax, slmaxd, changed];
        } else {
            return [null, null, null, null, false]
        }
    }


    function resetSlider() {
        if ( $("#slider").length > 0 ) {
            console.log('has slider');
            var slider = $("#slider");
            var slmind = $(slider).data('minPosDefault');
            var slmaxd = $(slider).data('maxPosDefault');

            $(slider).slider("values", 0, slmind);
            $(slider).slider("values", 1, slmaxd);

            var slmin  = $(slider).slider("values", 0);
            var slmax  = $(slider).slider("values", 1);

            console.log('min ',slmin,' mind ',slmind,' max ',slmax, ' maxd ',slmaxd);

        }
    }


    function posChanger() {
        var dst   = $(this).data('dst');

        var qry   = $('#data').data('request');
        var spp   = qry['ref'  ] || null;
        var chrom = qry['chrom'] || null;

        switch(dst)
        {
            case 'refresh':
                resetSlider();
                return;
                break;
            case 'first':
                qry['page'] = 0;
                break;
            case 'previous':
                if ( 'page' in qry ) {
                    qry['page'] -=  1;
                } else {
                    qry['page']  = 0;
                }
                break;
            case 'next':
                if ( 'page' in qry ) {
                    qry['page'] += 1;
                } else {
                    qry['page']  = 1;
                }
                break;
            case 'last':
                qry['page'] = -1;
                break;
            default:
                return;
                break;
        }

        if (qry['page'] < -1 ) {
            qry['page'] = -1;
        }

        submitDataQuery(spp, chrom, qry);

    }


    function showhelp(){
        window.open('/static/manual.png', '_blank');
    }
});
