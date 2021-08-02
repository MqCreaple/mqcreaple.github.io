$(document).ready(function() {
    $.get("template.html", function(template) {
        $.getJSON("blog.json", function(blogs) {
            /**
             * sort by certain keyword
             * @param {string} what 
             * @returns 
             */
             function sortBy(what, order) {
                 /**
                  * merge sort
                  * @param {string} what 
                  * @param {int} left 
                  * @param {int} right 
                  * @returns 
                  */
                function mergeSort(what, order, left, right) {
                    if(left == right) return [];
                    if(right - left == 1) {
                        return [blogs[left]];
                    }
                    var mid = (left + right) / 2;
                    var l = mergeSort(what, order, left, mid);
                    var r = mergeSort(what, order, mid, right);
                    var ans = [], i = left, j = mid;
                    while(i < mid && j < right) {
                        if(l[i - left][what] < r[j - mid][what] ^ order) {
                            ans.push(l[i - left]);
                            i++;
                        } else {
                            ans.push(r[j - mid]);
                            j++;
                        }
                    }
                    while(i < mid) {
                        ans.push(l[i - left]);
                        i++;
                    }
                    while(j < right) {
                        ans.push(r[j - mid]);
                        j++;
                    }
                    return ans;
                }
                return mergeSort(what, order, 0, blogs.length);
            }
            /**
             * show blogs
             */
            function showBlog() {
                $("#left").html("");
                $.each(sortBy($("#sort").val(), $("#order").val()), function(i, blog) {
                    var th = template.replace(/\{\%\s([\w-]+?)\s\%\}/g, function(m, key, s, txt) {
                        return blog[key];
                    });
                    $("#left").append(th);
                });
            }

            showBlog();
            $("#show").change(showBlog);
            //TODO search by tag
        });
    });
});