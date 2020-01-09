function replace(hide, show) {
    document.getElementById(hide).style.display = "none";
    document.getElementById(show).style.display = "flex";
}

function replace_side(hide, hide_2, show) {
    document.getElementById(hide).style.display = "none";
    document.getElementById(hide_2).style.display = "none";
    document.getElementById(show).style.display = "flex";
}

function getValue (id) {
    alert(id);
    return false;
}

/*function selected(hide,show){
    document.getElementById(selected).style.backgroundColor ="background-color: rgba(83, 81, 81, 0.31)"
}
*/
