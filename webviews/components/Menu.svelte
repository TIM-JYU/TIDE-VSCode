<div>
	<button><slot name="toggle" /></button>
	<menu><slot /></menu>
</div>

<style>
    div {
        transition: all 0.5s ease;
    }
	
  button {
    border: none;
    background-color: inherit;
    color:white;
    font-size: medium;
  }

  menu {
    position: absolute;
    display: none;
    margin-block-start: 0;
    padding: 0;
    border: 1px solid black;
    background-color: #272626;
    visibility: hidden;
    opacity: 0;  
		right: 1%;
    overflow: hidden;
  }

  div:hover,
  div:focus,
  div:hover > menu,
  div:focus > menu {
    display: block;
    visibility: visible;
    opacity: 1;
  }
</style>
