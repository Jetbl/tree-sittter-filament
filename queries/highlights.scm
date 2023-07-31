[
  "comp" 
  "extern" 
  "where" 
  "import" 
] @keyword

(comment) @comment

(identifier) @variable

(import
 (string_lit) @keyword.control.import)

(externals
 (string_lit) @keyword.control.import)

[
  "-"
  "+"
  "/"
  "*"
  "{"
  "}"
  "<="
  "=="
  "<"
  ">"
  ">="
  "%"
] @keyword.operator

