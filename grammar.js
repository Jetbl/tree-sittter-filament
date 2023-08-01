
module.exports = grammar({
  name: 'filament',

  extras: $ => [/\s/, $.comment],

  rules: {

   file: $ => seq(repeat($.import), repeat($._comp_or_ext)),

   bitwidth: $ => repeat1($._ASCII_DIGIT),

   string_lit: $ => seq("\"", repeat($._char), "\""),

   import: $ => seq("import", $.string_lit, ";"),

   identifier: $ => {
        const alpha_numeric = /[_a-zA-Z0-9]/
        const alpha = /[a-zA-Z]/
        return token(seq(alpha, repeat(alpha_numeric)))
   },

   _gt: $ => ">",

   _gte: $ => ">=",

   _lt: $ => "<",

   _lte: $ => "<=",

   _eq: $ => "==",

   _order_op: $ => choice($._gte, $._gt, $._lte, $._lt, $._eq),

   constraint: $ => choice(prec.left(4, seq($.expr , $._order_op, $.expr)), prec.left(4, seq($.time, $._order_op, $.time ))),
       
   constraints: $ => seq("where", $.constraint, repeat(seq(",", $.constraint))),

   params: $ => seq("[", $.param_bind, repeat(seq(",", $.param_bind)), "]"),

   param_bind: $ => choice(seq("?", $.param_var, "=", $.expr), $.param_var),

   signature: $ => seq($.identifier, optional($.params), optional($.abstract_var), $.io, optional($.constraints)),

   component: $ => seq("comp", $.signature, "{", repeat($.command), "}"),

   external: $ => seq("extern", $.string_lit, "{", repeat(seq("comp", $.signature, ";")), "}"),

   _comp_or_ext: $ => choice($.component, $.external),

   _pound: $ => "#",

   param_var: $ => seq($._pound, $.identifier),

   interface: $ => seq("@interface", "[", $.identifier, "]"),

   _pow2: $ => "pow2",

   _log2: $ => "log2",

   unknown_fn: $ => $.identifier,

   un_fn: $ => choice($._pow2, $._log2, $.unknown_fn),

   binary_expr: $ => choice(prec.left(10, seq($.expr, choice('*', '/', '%'), $.expr)) ,prec.left(9, seq($.expr, choice('+', '-'), $.expr))),
  
   unary_expr: $ => seq($.un_fn, "(", $.expr, ")"),

   expr: $ => choice($.unary_expr, $.binary_expr, seq("(", $.expr, ")"), $.bitwidth, $.param_var),

   delay: $ => choice($.expr, seq($.time, "-", "(", $.time, ")")),

   event_with_delay: $ => seq($.identifier, ":", $.delay),

   event_bind: $ => choice(seq("?", $.event_with_delay, "=", $.time), $.event_with_delay),

   abstract_var: $ => seq("<", $.event_bind, repeat(seq(",", $.event_bind)), ">"),

   time: $ => choice(seq($.identifier, "+", $.expr), seq($.expr, "+", $.identifier), $.identifier, $.expr),

   interval_range: $ => seq("@", "[", $.time, ",", $.time, "]"),

   port_def: $ => choice(seq(optional(choice($.interval_range, $.interface)), $.identifier, ":", $.expr), seq($.identifier, "[", $.expr, "]", ":", $.bundle_typ)),

   _arrow: $ => "->",

   io: $ => seq("(", optional($.ports), ")", $._arrow, "(", optional($.ports), ")"),

   ports: $ => seq($.port_def, repeat(seq(",", $.port_def)), optional(",")),

   conc_params: $ => seq("[", $.expr, repeat(seq(",", $.expr)), "]"),

   instance: $ => seq($.identifier, ":=", "new", $.identifier, optional($.conc_params), optional($.invoke_args), ";"),

   guard: $ => seq($.port, optional(seq("|", $.guard))),

   connect: $ => seq($.port, "=", optional(seq($.guard, "?")), $.port, ";"),

   _dots: $ => "..",

   access: $ => seq("{", choice(seq($.expr, $._dots, $.expr), $.expr), "}"),

   port: $ => choice(seq($.identifier, ".", $.identifier, optional($.access)), seq($.identifier, optional($.access)), $.bitwidth),

   arguments: $ => choice(seq("(", ")"), seq("(", $.port, repeat(seq(",", $.port)), ")")),

   time_args: $ => seq("<", $.time, repeat(seq(",", $.time)), ">"),

   invoke_args: $ => seq($.time_args, $.arguments),

   invocation: $ => seq($.identifier, ":=", $.identifier, $.invoke_args, ";"),

   expr_cmp: $ => prec.left(4, seq($.expr, $._order_op, $.expr)),

   if_stmt: $ => seq("if", $.expr_cmp, "{", repeat($.command), "}", optional(seq("else", "{", repeat($.command), "}"))),

   for_loop: $ => seq("for", $.param_var, "in", $.expr, "..", $.expr, "{", repeat($.command), "}"),

   bundle_typ: $ => seq("for", "<", $.param_var, ">", $.interval_range, $.expr),

   bundle: $ => seq("bundle", $.identifier, "[", $.expr, "]", ":", $.bundle_typ, ";"),

   implication: $ => seq(optional(seq($.expr_cmp, "=>")), $.expr_cmp),

   assume_w: $ => "assume",

   assert_w: $ => "assert",

   fact: $ => seq(choice($.assume_w, $.assert_w), $.implication, ";"),

   command: $ => choice($.bundle, $.instance, $.invocation, $.connect, $.for_loop, $.if_stmt, $.fact),

   _ASCII_ALPHA: $ => /[a-zA-Z]/,

   _ASCII_DIGIT: $ => /[0-9]/,

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

