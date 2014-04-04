require 'webrick'

server = WEBrick::HTTPServer.new :BindAddress => "0.0.0.0", :Port => 55555

class Simple < WEBrick::HTTPServlet::AbstractServlet
  def do_POST request, response
    response.status = 200
    response['Content-Type'] = 'text/plain'

    file = File.open("/tmp/js-client-logger.output", "a")
    file.write "#{Time.new.to_s}  -- #{request.query_string} -- #{request.body} \n\n"
    file.close unless file == nil
  end
end

trap 'INT' do
  server.shutdown
end

server.mount '/services/logger/log', Simple
server.start
