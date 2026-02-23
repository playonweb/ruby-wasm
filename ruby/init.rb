# ruby/init.rb
require 'json'

$store = TodoStore.new
$todos = $store

[
  {title:'Design Ruby WASM demo',         priority:'high',   tags:['ruby','wasm','demo'],    due_date:(Date.today-1).to_s},
  {title:'Write blog post on WASM',       priority:'medium', tags:['writing','ruby'],       due_date:(Date.today+2).to_s},
  {title:'Benchmark ruby.wasm vs JS',     priority:'high',   tags:['performance','wasm']},
  {title:'Add Struct-based value objects',priority:'low',    tags:['refactor','ruby']},
  {title:'Try Enumerable in the browser', priority:'medium', tags:['ruby','fun'],           due_date:(Date.today+1).to_s},
].each{|t| $store.add(**t)}

$store.toggle(3)
"Ruby #{RUBY_VERSION} initialized"
