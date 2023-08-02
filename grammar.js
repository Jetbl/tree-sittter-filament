
module.exports = grammar({
  name: 'filament',

  extras: $ => [/\s/, $.comment],

  rules: {

   file: $ => seq(repeat($.import), repeat($._comp_or_ext)),

   import: $ => seq("import", $.string_lit, ";"),

   identifier: $ => {
        const alpha_numeric = /[_a-zA-Z0-9]/
        const alpha = /[a-zA-Z]/
        return token(seq(alpha, repeat(alpha_numeric)))
   },

   order_op: $ => token(choice(">", ">=", "<", "<=", "==")),

   constraint: $ => choice(prec.left(4, seq($.expr , $.order_op, $.expr)), prec.left(4, seq($.time, $.order_op, $.time ))),
       
   constraints: $ => seq("where", $.constraint, repeat(seq(",", $.constraint))),

   params: $ => seq("[", $.param_bind, repeat(seq(",", $.param_bind)), "]"),

   param_bind: $ => choice(seq("?", $.param_var, "=", $.expr), $.param_var),

   signature: $ => seq($.identifier, optional($.params), optional($.abstract_var), $.io, optional($.constraints)),

   component: $ => seq("comp", $.signature, "{", repeat($.command), "}"),

   external: $ => seq("extern", $.string_lit, "{", repeat(seq("comp", $.signature, ";")), "}"),

   _comp_or_ext: $ => choice($.component, $.external),

   param_var: $ => seq("#", $.identifier),

   interface: $ => seq("@interface", "[", $.identifier, "]"),

   un_fn: $ => choice("pow2", "log2", $.identifier),

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

   io: $ => seq("(", optional($.ports), ")", "->", "(", optional($.ports), ")"),

   ports: $ => seq($.port_def, repeat(seq(",", $.port_def)), optional(",")),

   conc_params: $ => seq("[", $.expr, repeat(seq(",", $.expr)), "]"),

   instance: $ => seq($.identifier, ":=", "new", $.identifier, optional($.conc_params), optional($.invoke_args), ";"),

   guard: $ => seq($.port, optional(seq("|", $.guard))),

   connect: $ => seq($.port, "=", optional(seq($.guard, "?")), $.port, ";"),

   access: $ => seq("{", choice(seq($.expr, "..", $.expr), $.expr), "}"),

   port: $ => choice(seq($.identifier, ".", $.identifier, optional($.access)), seq($.identifier, optional($.access)), $.bitwidth),

   arguments: $ => choice(seq("(", ")"), seq("(", $.port, repeat(seq(",", $.port)), ")")),

   time_args: $ => seq("<", $.time, repeat(seq(",", $.time)), ">"),

   invoke_args: $ => seq($.time_args, $.arguments),

   invocation: $ => seq($.identifier, ":=", $.identifier, $.invoke_args, ";"),

   expr_cmp: $ => prec.left(4, seq($.expr, $.order_op, $.expr)),

   if_stmt: $ => seq("if", $.expr_cmp, "{", repeat($.command), "}", optional(seq("else", "{", repeat($.command), "}"))),

   for_loop: $ => seq("for", $.param_var, "in", $.expr, "..", $.expr, "{", repeat($.command), "}"),

   bundle_typ: $ => seq("for", "<", $.param_var, ">", $.interval_range, $.expr),

   bundle: $ => seq("bundle", $.identifier, "[", $.expr, "]", ":", $.bundle_typ, ";"),

   implication: $ => seq(optional(seq($.expr_cmp, "=>")), $.expr_cmp),

   fact: $ => seq(choice("assume", "assert"), $.implication, ";"),

   command: $ => choice($.bundle, $.instance, $.invocation, $.connect, $.for_loop, $.if_stmt, $.fact),

   bitwidth: $ => repeat1(/[0-9]/),

   string_lit: $ => seq("\"", repeat(/[^"]/), "\""),

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

