# app/channels/room_channel.rb
class RoomChannel < ApplicationCable::Channel
  def subscribed
    stream_from "room_channel"
    Rails.logger.info("Client subscribed to room_channel")
  end

  def unsubscribed
    Rails.logger.info("Client unsubscribed from room_channel")
  end

  # Updated speak method
  def speak(data)
    # Log both the message content and the user ID
    Rails.logger.info("Received message: '#{data['message']}' from user_id: '#{data['user_id']}'")

    # Create the message in the database, now including the user_id
    message = Message.create!(
      content: data["message"],
      user_id: data["user_id"] # Save the received user_id
    )

    # Render the message partial to HTML.
    # The partial will now automatically include the user_id from the message object.
    rendered_message = ApplicationController.render(
      partial: "messages/message",
      locals: { message: message }
    )

    # Broadcast the rendered HTML (which includes the user_id prefix)
    ActionCable.server.broadcast "room_channel", { message_html: rendered_message }
    Rails.logger.info("Broadcasted message HTML (with user_id) to room_channel")

  rescue ActiveRecord::RecordInvalid => e
    Rails.logger.error("Failed to save message: #{e.message}")
    # Optionally notify the sender about the failure
  end
end
