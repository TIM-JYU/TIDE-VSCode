<li><slot /></li>

<style>
  li {
    position: relative;
    display: block;
    padding: 0.5rem;
    transition-duration: 0.5s;
    inline-size: 100%;
    font-size: 14px;
  }

  li:hover,
  li:focus {
    background-color: grey;
    cursor: pointer;
  }
</style>
