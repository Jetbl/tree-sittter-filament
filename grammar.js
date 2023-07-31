module.exports = grammar({
  name: 'filament',

  extras: $ => [/\s/, $.comment],

  rules: {
    // source_file: $ => seq(repeat($.import), repeat($.comp_or_external)),

    source_file: $ => seq(repeat($.import), repeat($.externals)),

    import: $ => seq('import', $.string_lit, ';'),

    // comp_or_external: $ => choice('comp', $.external),

    externals: $ => seq('extern', $.string_lit, '{', repeat1($.external), '}'),

    external: $ => seq('comp', $.signature, ';'),

    signature: $ => seq($.identifier, optional($.params), optional($.abstract_var), $.io, optional($.constraints)),
    // signature: $ => seq($.identifier, optional($.params), optional($.abstract_var), $.io),

    constraints: $ => seq('where', $.constraint, repeat(seq(',', $.constraint))),

    constraint: $ => choice(prec.left(4, seq($.expr , $._order_op, $.expr)), prec.left(4, seq($.time, $._order_op, $.time ))),

    _order_op : $ => choice('>', '>=', '<', '<=', '=='),

    io: $ => seq('(', optional($.ports), ')', '->', '(', optional($.ports), ')'),

    ports: $ => seq($.port_def, repeat(seq(',', $.port_def)), optional(',')),

    port_def: $ => choice(seq(optional(choice($.interval_range, $.interface)), $.identifier, ':', $.expr)),

    interval_range: $ => seq('@', '[', $.time,',', $.time, ']'),

    interface: $ => seq('@interface', '[', $.identifier, ']'),

    time: $ => choice(seq($.identifier, '+', $.expr), seq ($.expr, '+', $.identifier), $.identifier, $.expr ),


    abstract_var: $ => seq('<', $.event_bind, repeat(seq(',', $.event_bind)), '>'),

    event_bind: $ => choice(seq('?', $.event_with_delay, '=', $.time), $.event_with_delay),

    event_with_delay: $ => seq( $.identifier, ':', $.delay),

    delay: $ => choice( $.expr, seq($.time, '-', '(', $.time ,')')),

    expr: $ => choice($.expr_base, $.binary_expr),

    binary_expr: $ => choice(prec.left(10, seq($.expr_base, choice('*', '/', '%'), $.expr_base)) ,prec.left(9, seq($.expr_base, choice('+', '-'), $.expr_base))),
    // expr: $ => seq($.expr_base, repeat(seq($._operator, $.expr_base))),
    // _operator: $ => choice('*', '/', '%', '+', '-'),
    // _operator: $ => '+',

    expr_base: $ => choice( seq('(', $.expr ,')'), $.bitwidth, $.param_var /* TODO other expr_base */),

    params: $ => seq('[', $.param_bind, repeat(seq(',', $.param_bind)), ']'),

    param_bind: $ => choice(seq('?', $.param_var, '=', $.expr), $.param_var),

    param_var: $ => seq('#', $.identifier),
        
    identifier: $ => {
        const alpha_numeric = /[_a-zA-Z0-9]/
        const alpha = /[a-zA-Z]/
        return token(seq(alpha, repeat(alpha_numeric)))
    },

    bitwidth: $ => /[0-9]+/,

    string_lit: $ => seq('"', repeat($._char) , '"'),


    _ascii_digit: $ => /[0-9]/,

    _char: $ => /[^"]/,

    
    comment: $ => token(choice(
        seq('//', /.*/),
        seq(
          '/*',
          /[^*]*\*+([^/*][^*]*\*+)*/,
          '/'
        ),
    )),

  }
});
