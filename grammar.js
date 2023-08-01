
module.exports = grammar({
  name: 'filament',

  extras: $ => [/\s/, $.comment],

  rules: {

   file: $ => seq($.imports, repeat($.comp_or_ext)),

   bitwidth: $ => repeat1($.ASCII_DIGIT),

   string_lit: $ => seq("\"", repeat($.char), "\""),

   import: $ => seq("import", $.string_lit, ";"),

   imports: $ => repeat($.import),

   identifier: $ => seq(repeat1(choice("_", $.ASCII_ALPHA)), repeat(choice("_", $.ASCII_ALPHA, $.ASCII_DIGIT))),

   gt: $ => ">",

   gte: $ => ">=",

   lt: $ => "<",

   lte: $ => "<=",

   eq: $ => "==",

   order_op: $ => choice($.gte, $.gt, $.lte, $.lt, $.eq),

   constraint: $ => choice(seq($.expr, $.order_op, $.expr), seq($.time, $.order_op, $.time)),

   constraints: $ => optional(seq("where", $.constraint, repeat(seq(",", $.constraint)))),

   params: $ => optional(seq("[", $.param_bind, repeat(seq(",", $.param_bind)), "]")),

   param_bind: $ => choice(seq("?", $.param_var, "=", $.expr), $.param_var),

   signature: $ => seq($.identifier, $.params, optional($.abstract_var), $.io, $.constraints),

   component: $ => seq("comp", $.signature, "{", repeat($.command), "}"),

   external: $ => seq("extern", $.string_lit, "{", repeat(seq("comp", $.signature, ";")), "}"),

   comp_or_ext: $ => choice($.component, $.external),

   pound: $ => "#",

   param_var: $ => seq($.pound, $.identifier),

   interface: $ => seq("@interface", "[", $.identifier, "]"),

   op_mul: $ => "*",

   op_div: $ => "/",

   op_mod: $ => "%",

   op_add: $ => "+",

   op_sub: $ => "-",

   operator: $ => choice($.op_mul, $.op_div, $.op_add, $.op_sub, $.op_mod),

   pow2: $ => "pow2",

   log2: $ => "log2",

   unknown_fn: $ => $.identifier,

   un_fn: $ => choice($.pow2, $.log2, $.unknown_fn),

   expr_base: $ => choice(seq($.un_fn, "(", $.expr, ")"), seq("(", $.expr, ")"), $.bitwidth, $.param_var),

   expr: $ => seq($.expr_base, repeat(seq($.operator, $.expr_base))),

   delay: $ => choice($.expr, seq($.time, "-", "(", $.time, ")")),

   event_with_delay: $ => seq($.identifier, ":", $.delay),

   event_bind: $ => choice(seq("?", $.event_with_delay, "=", $.time), $.event_with_delay),

   abstract_var: $ => seq("<", $.event_bind, repeat(seq(",", $.event_bind)), ">"),

   time: $ => choice(seq($.identifier, "+", $.expr), seq($.expr, "+", $.identifier), $.identifier, $.expr),

   interval_range: $ => seq("@", "[", $.time, ",", $.time, "]"),

   port_def: $ => choice(seq(optional(choice($.interval_range, $.interface)), $.identifier, ":", $.expr), seq($.identifier, "[", $.expr, "]", ":", $.bundle_typ)),

   arrow: $ => "->",

   io: $ => seq("(", optional($.ports), ")", $.arrow, "(", optional($.ports), ")"),

   ports: $ => seq($.port_def, repeat(seq(",", $.port_def)), optional(",")),

   conc_params: $ => optional(seq("[", $.expr, repeat(seq(",", $.expr)), "]")),

   instance: $ => seq($.identifier, ":=", "new", $.identifier, $.conc_params, optional($.invoke_args), ";"),

   guard: $ => seq($.port, optional(seq("|", $.guard))),

   connect: $ => seq($.port, "=", optional(seq($.guard, "?")), $.port, ";"),

   dots: $ => "..",

   access: $ => seq("{", choice(seq($.expr, $.dots, $.expr), $.expr), "}"),

   port: $ => choice(seq($.identifier, ".", $.identifier, optional($.access)), seq($.identifier, optional($.access)), $.bitwidth),

   arguments: $ => choice(seq("(", ")"), seq("(", $.port, repeat(seq(",", $.port)), ")")),

   time_args: $ => seq("<", $.time, repeat(seq(",", $.time)), ">"),

   invoke_args: $ => seq($.time_args, $.arguments),

   invocation: $ => seq($.identifier, ":=", $.identifier, $.invoke_args, ";"),

   expr_cmp: $ => seq($.expr, $.order_op, $.expr),

   if_stmt: $ => seq("if", $.expr_cmp, "{", $.commands, "}", optional(seq("else", "{", $.commands, "}"))),

   for_loop: $ => seq("for", $.param_var, "in", $.expr, "..", $.expr, "{", $.commands, "}"),

   bundle_typ: $ => seq("for", "<", $.param_var, ">", $.interval_range, $.expr),

   bundle: $ => seq("bundle", $.identifier, "[", $.expr, "]", ":", $.bundle_typ, ";"),

   implication: $ => seq(optional(seq($.expr_cmp, "=>")), $.expr_cmp),

   assume_w: $ => "assume",

   assert_w: $ => "assert",

   fact: $ => seq(choice($.assume_w, $.assert_w), $.implication, ";"),

   command: $ => choice($.bundle, $.instance, $.invocation, $.connect, $.for_loop, $.if_stmt, $.fact),

   commands: $ => repeat($.command),

   ASCII_ALPHA: $ => /[a-zA-Z]/,

   ASCII_DIGIT: $ => /[0-9]/,

   char: $ => /[^"]/,

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

