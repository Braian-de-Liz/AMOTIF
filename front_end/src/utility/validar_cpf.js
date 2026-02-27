const validar_cpf = (cpf) => {
    cpf.replace(/[^\d]/g, '');

    if(cpf.length !== 11){
        alert("cpf inválido");
        return false;
    }
    return cpf;
}

export { validar_cpf };