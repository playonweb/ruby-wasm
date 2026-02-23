# ruby/init.rb
require 'json'
require 'rubygems'

puts "--- Ruby init sequence started ---"
puts "Initial LOAD_PATH: #{$LOAD_PATH}"
puts "Initial Gem path: #{Gem.path}"

# Force set Gem path to our VFS mount
Gem.use_paths(nil, ['/gems'])
puts "New Gem path: #{Gem.path}"

begin
  puts "Attempting to require faker..."
  require 'faker'
  puts "Faker loaded successfully!"
rescue LoadError => e
  puts "Faker load failed: #{e.message}. Attempting manual path injection..."
  # Look for faker specifically if it's not being found
  faker_lib = Dir.glob('/gems/gems/faker-*/lib').first
  if faker_lib
    puts "Found faker lib at: #{faker_lib}. Adding to LOAD_PATH."
    $LOAD_PATH << faker_lib
    require 'faker'
    puts "Faker loaded via manual LOAD_PATH!"
  else
    puts "Could not find faker lib in /gems/gems/"
  end
end

begin
  puts "Attempting to require rouge..."
  require 'rouge'
  puts "Rouge loaded successfully!"
rescue LoadError => e
  puts "Rouge load failed: #{e.message}. Attempting manual path injection..."
  rouge_lib = Dir.glob('/gems/gems/rouge-*/lib').first
  if rouge_lib
    puts "Found rouge lib at: #{rouge_lib}. Adding to LOAD_PATH."
    $LOAD_PATH << rouge_lib
    require 'rouge'
    puts "Rouge loaded via manual LOAD_PATH!"
  else
    puts "Could not find rouge lib in /gems/gems/"
  end
end

$store = TodoStore.new
$todos = $store

def generate_fake_task
  title = Faker::Hacker.say_something_smart
  priority = %w[high medium low].sample
  tags = [Faker::Internet.domain_word, Faker::Hacker.noun].uniq
  due_date = Faker::Date.forward(days: 14).to_s
  
  $store.add(title: title, priority: priority, tags: tags, due_date: due_date)
end

def format_repl_output(text)
  begin
    require 'rouge/themes/monokai_sublime'
    theme = Rouge::Theme.find('monokai_sublime') || Rouge::Themes::MonokaiSublime
    formatter = Rouge::Formatters::HTMLInline.new(theme.new)
    lexer = Rouge::Lexers::Ruby.new
    formatter.format(lexer.lex(text.to_s))
  rescue => e
    puts "Formatting error: #{e.message}"
    # Fallback to plain text with basic escaping
    CGI.escapeHTML(text.to_s) rescue text.to_s
  end
end

# Seed initial tasks
[
  {title:'Design Ruby WASM demo',         priority:'high',   tags:['ruby','wasm','demo'],    due_date:(Date.today-1).to_s},
  {title:'Write blog post on WASM',       priority:'medium', tags:['writing','ruby'],       due_date:(Date.today+2).to_s},
  {title:'Benchmark ruby.wasm vs JS',     priority:'high',   tags:['performance','wasm']},
].each{|t| $store.add(**t)}

# Add some fake ones
2.times { generate_fake_task }

puts "--- Ruby init sequence complete ---"
"Ruby #{RUBY_VERSION} initialized with Faker & Rouge"
