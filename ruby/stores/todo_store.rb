# ruby/stores/todo_store.rb

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
