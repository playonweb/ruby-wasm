# ruby/models/todo.rb
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
