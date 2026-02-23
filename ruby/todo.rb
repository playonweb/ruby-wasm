# ruby/todo.rb
require 'json'
require 'date'

class Todo
  attr_accessor :id, :title, :priority, :tags, :due_date, :done, :created_at, :notes
  PRIORITIES = %w[high medium low].freeze

  def initialize(id:, title:, priority: 'medium', tags: [], due_date: nil, notes: '')
    @id         = id
    @title      = title.to_s
    @priority   = PRIORITIES.include?(priority) ? priority : 'medium'
    @tags       = Array(tags).map(&:strip).reject(&:empty?)
    @due_date   = due_date && !due_date.empty? ? Date.parse(due_date) : nil
    @done       = false
    @created_at = Time.now
    @notes      = notes.to_s
  end

  def overdue?  = !@done && @due_date && @due_date < Date.today
  def due_soon? = !@done && @due_date && @due_date >= Date.today && @due_date <= Date.today + 3
  def priority_rank = {'high'=>0,'medium'=>1,'low'=>2}.fetch(@priority,1)

  def matches?(q)
    q = q.downcase
    @title.downcase.include?(q) || @tags.any?{|t| t.downcase.include?(q)} || @notes.downcase.include?(q)
  end

  def to_h
    { id: @id, title: @title, priority: @priority, tags: @tags,
      due_date: @due_date&.to_s, done: @done,
      created_at: @created_at.to_s, notes: @notes }
  end
  def to_json(*) = to_h.to_json
end

class TodoStore
  include Enumerable

  def initialize
    @todos = []
    @seq   = 0
  end

  def add(title:, priority: 'medium', tags: [], due_date: nil, notes: '')
    @seq += 1
    t = Todo.new(id: @seq, title: title, priority: priority,
                 tags: tags, due_date: due_date, notes: notes)
    @todos << t; t
  end

  def remove(id) = @todos.reject!{|t| t.id == id}
  def toggle(id) = find_by_id(id)&.tap{|t| t.done = !t.done}
  def find_by_id(id) = @todos.find{|t| t.id == id}
  def each(&b) = @todos.each(&b)

  def filter(type, query: '')
    base = case type
    when 'active'  then @todos.reject(&:done)
    when 'done'    then @todos.select(&:done)
    when 'high'    then @todos.select{|t| t.priority=='high' && !t.done}
    when 'overdue' then @todos.select(&:overdue?)
    else                @todos
    end
    query.empty? ? base : base.select{|t| t.matches?(query)}
  end

  def sorted_filtered(type, query: '')
    filter(type, query: query)
      .sort_by{|t| [t.done ? 1 : 0, t.priority_rank, t.title]}
  end

  def analytics
    total    = @todos.size
    done_c   = @todos.count(&:done)
    pct      = total.zero? ? 0.0 : (done_c * 100.0 / total).round(1)
    by_pri   = @todos.group_by(&:priority).transform_values(&:count)
    overdue  = @todos.count(&:overdue?)
    due_soon = @todos.count(&:due_soon?)
    top_tags = @todos.flat_map(&:tags).tally.sort_by{|_,v|-v}.first(5).to_h
    { total: total, done: done_c, active: total-done_c,
      pct_complete: pct, by_priority: by_pri,
      overdue: overdue, due_soon: due_soon, top_tags: top_tags }
  end

  def to_json(*) = @todos.to_json
end

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
"Ruby #{RUBY_VERSION} ready"
