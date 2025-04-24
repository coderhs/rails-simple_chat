class RoomsController < ApplicationController
  def show
    @messages = Message.order(created_at: :asc) # Load messages in chronological order
  end
end
