use std::fmt::Display;
use std::str::FromStr;

use pest_meta::ast;
use pest_meta::parser;

#[derive(Debug)]
struct TSGrammar {
    name: &'static str,
    rules: Vec<TSRule>,
}

impl FromStr for TSGrammar {
    type Err = ();

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        let pairs = parser::parse(pest_meta::parser::Rule::grammar_rules, s).map_err(|_| ())?;
        let rules = parser::consume_rules(pairs).map_err(|_| ())?;
        let mut rules = rules
            .into_iter()
            // .inspect(|r| {
            //     if r.name == "string_lit" {
            //         dbg!(r);
            //     }
            // })
            .filter(|r| {
                matches!(
                    r.ty,
                    pest_meta::ast::RuleType::Atomic
                        | pest_meta::ast::RuleType::Normal
                        | pest_meta::ast::RuleType::Silent
                        | pest_meta::ast::RuleType::CompoundAtomic
                )
            })
            .map(|r| r.into())
            .collect::<Vec<TSRule>>();

        rules.extend([
            TSRule {
                name: "ASCII_ALPHA".to_owned(),
                expr: TSExpr::Raw("/[a-zA-Z]/"),
            },
            TSRule {
                name: "ASCII_DIGIT".to_owned(),
                expr: TSExpr::Raw("/[0-9]/"),
            },
            TSRule {
                name: "char".to_owned(),
                expr: TSExpr::Raw("/[^\"]/"),
            },
            TSRule {
                name: "comment".to_owned(),
                expr: TSExpr::Raw(
                    r#"token(choice(
        seq('//', /.*/),
        seq(
          '/*',
          /[^*]*\*+([^/*][^*]*\*+)*/,
          '/'
        ),
    ))"#,
                ),
            },
        ]);

        let idx = rules.iter().position(|r| r.name == "file");
        if let Some(idx) = idx {
            rules.swap(0, idx);
        }

        Ok(Self {
            name: "filament",
            rules,
        })
    }
}

impl Display for TSGrammar {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        writeln!(
            f,
            r#"
module.exports = grammar({{
  name: '{}',

  extras: $ => [/\s/, $.comment],

  rules: {{
"#,
            self.name
        )?;
        for rule in &self.rules {
            writeln!(f, "{rule}")?;
        }
        writeln!(
            f,
            r#"
  }}
}});"#,
        )
    }
}

#[derive(Debug)]
struct TSRule {
    name: String,
    expr: TSExpr,
}

impl Display for TSRule {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        writeln!(f, "   {}: $ => {},", self.name, self.expr)
    }
}

impl<'i> From<ast::Rule> for TSRule {
    fn from(rule: ast::Rule) -> Self {
        Self {
            name: rule.name.clone(),
            expr: TSExpr::from(rule.expr),
        }
    }
}

#[derive(Debug)]
enum TSExpr {
    SOI,
    EOI,
    Str(String),
    Ref(String),
    Seq(Vec<Box<TSExpr>>),
    Choice(Vec<Box<TSExpr>>),
    Optional(Box<TSExpr>),
    Repeat(Box<TSExpr>),
    Repeat1(Box<TSExpr>),
    Raw(&'static str),
}

impl Display for TSExpr {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let dump =
            |f: &mut std::fmt::Formatter<'_>, exprs: &Vec<Box<TSExpr>>| -> std::fmt::Result {
                let mut exprs = exprs
                    .into_iter()
                    .filter(|e| !matches!(***e, TSExpr::SOI | TSExpr::EOI));
                if let Some(expr) = exprs.next() {
                    write!(f, "{expr}")?;
                }
                for expr in exprs {
                    write!(f, ", {expr}")?;
                }
                Ok(())
            };

        match self {
            TSExpr::Str(s) => write!(f, "{s}"),
            TSExpr::Seq(exprs) => {
                write!(f, "seq(")?;
                dump(f, exprs)?;
                write!(f, ")")
            }
            TSExpr::Choice(exprs) => {
                write!(f, "choice(")?;
                dump(f, exprs)?;
                write!(f, ")")
            }
            TSExpr::Optional(e) => write!(f, "optional({e})"),
            TSExpr::Repeat(e) => write!(f, "repeat({e})"),
            TSExpr::Repeat1(e) => write!(f, "repeat1({e})"),
            TSExpr::Ref(id) => write!(f, "$.{id}"),
            TSExpr::Raw(r) => write!(f, "{r}"),
            _ => todo!(),
        }
    }
}

impl From<ast::Expr> for TSExpr {
    fn from(expr: ast::Expr) -> Self {
        match expr {
            pest_meta::ast::Expr::Str(s) => Self::Str(format!("\"{}\"", s.replace('"', "\\\""))),
            pest_meta::ast::Expr::Ident(id) => match id.as_str() {
                "SOI" => Self::SOI,
                "EOI" => Self::EOI,
                id => Self::Ref(id.to_owned()),
            },
            pest_meta::ast::Expr::Seq(l, r) => {
                let mut inner = vec![];
                let mut flatten = |expr| match expr {
                    TSExpr::Seq(v) => inner.extend(v),
                    expr => inner.push(Box::new(expr)),
                };
                let l = TSExpr::from(*l);
                flatten(l);
                let r = TSExpr::from(*r);
                flatten(r);
                TSExpr::Seq(inner)
            }
            pest_meta::ast::Expr::Choice(l, r) => {
                let mut inner = vec![];
                let mut flatten = |expr| match expr {
                    TSExpr::Choice(v) => inner.extend(v),
                    expr => inner.push(Box::new(expr)),
                };
                let l = TSExpr::from(*l);
                flatten(l);
                let r = TSExpr::from(*r);
                flatten(r);
                TSExpr::Choice(inner)
            }
            pest_meta::ast::Expr::Opt(e) => TSExpr::Optional(Box::new(TSExpr::from(*e))),
            pest_meta::ast::Expr::Rep(e) => TSExpr::Repeat(Box::new(TSExpr::from(*e))),
            pest_meta::ast::Expr::RepOnce(e) => TSExpr::Repeat1(Box::new(TSExpr::from(*e))),
            s => todo!("{s:?}"),
        }
    }
}

fn main() {
    // let data = r#"
    //     foo = _{ "foo" }
    // "#;
    // let data = include_str!("/home/adiallo/wks/fpga/filament/src/frontend/syntax.pest");
    let data = include_str!("filament.pest");
    let g = TSGrammar::from_str(data).unwrap();
    println!("{g}");
}
