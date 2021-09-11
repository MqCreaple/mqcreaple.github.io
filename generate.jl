using JSON
using Markdown

file_config = open("config.json")
config = JSON.parse(file_config)
html_head = open("include/head.html")
head = read(html_head, String)
head = replace(head, r"\{\{[\w\-\.\/]+?\}\}" => s -> config[s])
html_header = open("include/header.html")
header = read(html_header, String)
header = replace(header, r"\{\{[\w\-\.\/]+?\}\}" => s -> config[s])
html_avatar = open("include/avatar.html")
avatar = read(html_avatar, String)
avatar = replace(avatar, r"\{\{[\w\-\.\/]+?\}\}" => s -> config[s])
html_footer = open("include/footer.html")
footer = read(html_footer, String)
footer = replace(footer, r"\{\{[\w\-\.\/]+?\}\}" => s -> config[s])

cd("_markdown/")
files = readdir()
for markdown_file in files
    file = open(markdown_file)
    filep = read(file, String)
    filep = replace(filep, r"\{\{[\w\-\.\/]+?\}\}" => s -> config[s])
    md = Markdown.parse(filep)
    md_html = Markdown.html(md)
    md_title = match(r"<h1>(.+?)<\/h1>", md_html).captures[1]
    full_html = """<!DOCTYPE html>
<html>
<head>
<title>$md_title | NYTxx</title>
$head
</head>
<body>
<div id='container'>
    $header
    <div id='main'>
        <div id='left'>
        <div class='card article'>
        $md_html
        </div>
        </div>
        <div id='right'>
        $avatar
        </div>
    </div>
    $footer
</div>
</body>
</html>"""
    open("../blog/$(match(r"[\w\-\/]+", markdown_file).match)/index.html", "w") do target
        write(target, full_html)
    end
    println("file ($markdown_file | $md_title) loaded")
    close(file)
end


close(html_head)
close(file_config)