using UnityEngine;
using System.Collections;
using System.Collections.Generic;


public class Ball : MonoBehaviour
{
    public Rigidbody rb;

    // Start is called once before the first execution of Update after the MonoBehaviour is created
    void Start()
    {
        rb = GetComponent<Rigidbody>();
    }

    // Update is called once per frame
    void Update()
    {
        if (Input.GetKeyDown(KeyCode.Return))
        {
            rb.AddForce(Vector3.forward * 4000);
            AudioSource source = GetComponent<AudioSource>();
            source.Play();
        }
 
    }
}